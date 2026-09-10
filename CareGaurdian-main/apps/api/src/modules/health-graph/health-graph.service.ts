import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  HealthGraphNode,
  HealthGraphEdge,
  HealthGraph,
} from '@baseline/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class HealthGraphService {
  private readonly logger = new Logger(HealthGraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build a patient Health Graph:
   * - Nodes: medications, conditions, episodes, fall/hospitalization/symptom events
   * - Edges: temporal relationships between events and entities
   */
  async build(patientId: string): Promise<{ data: HealthGraph }> {
    // ------------------------------------------------------------------
    // 1. Fetch all relevant data in parallel
    // ------------------------------------------------------------------
    const [
      medications,
      conditions,
      episodes,
      healthEvents,
    ] = await Promise.all([
      this.prisma.medication.findMany({
        where: { patientId, status: 'ACTIVE' },
      }),
      this.prisma.condition.findMany({
        where: { patientId, status: 'ACTIVE' },
      }),
      this.prisma.episode.findMany({
        where: { patientId },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.healthEvent.findMany({
        where: { patientId },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    // ------------------------------------------------------------------
    // 2. Build nodes
    // ------------------------------------------------------------------
    const nodes: HealthGraphNode[] = [];

    // Medication nodes
    for (const med of medications) {
      nodes.push({
        id: med.id,
        type: 'MEDICATION',
        label: med.name,
        date: med.startedAt ? med.startedAt.toISOString() : null,
      });
    }

    // Condition nodes
    for (const cond of conditions) {
      nodes.push({
        id: cond.id,
        type: 'CONDITION',
        label: cond.name,
        date: cond.diagnosedAt ? cond.diagnosedAt.toISOString() : null,
      });
    }

    // Episode nodes
    for (const ep of episodes) {
      nodes.push({
        id: ep.id,
        type: 'EPISODE',
        label: ep.title,
        date: ep.startDate.toISOString(),
      });
    }

    // HealthEvent nodes (fall, hospitalization, symptom, cognitive change, etc.)
    const eventNodeTypes = new Set([
      'FALL',
      'NEAR_FALL',
      'HOSPITALIZATION',
      'ER_VISIT',
      'SYMPTOM',
      'COGNITIVE_CHANGE',
      'FUNCTIONAL_CHANGE',
    ]);

    for (const evt of healthEvents) {
      if (eventNodeTypes.has(evt.type)) {
        nodes.push({
          id: evt.id,
          type: evt.type === 'FALL' || evt.type === 'NEAR_FALL' ? 'FALL'
            : evt.type === 'HOSPITALIZATION' ? 'HOSPITALIZATION'
            : evt.type === 'SYMPTOM' ? 'SYMPTOM'
            : 'OBSERVATION',
          label: `${evt.type}${evt.description ? ': ' + evt.description.slice(0, 80) : ''}`,
          date: evt.timestamp.toISOString(),
        });
      }
    }

    // ------------------------------------------------------------------
    // 3. Build edges
    // ------------------------------------------------------------------
    const edges: HealthGraphEdge[] = [];
    const edgeSet = new Set<string>(); // dedup key

    const addEdge = (
      from: string,
      to: string,
      relation: HealthGraphEdge['relation'],
      strength: number,
      evidenceIds: string[] = [],
    ) => {
      const key = `${from}|${to}|${relation}`;
      if (edgeSet.has(key)) return;
      edgeSet.add(key);
      edges.push({ from, to, relation, strength, evidenceIds });
    };

    // --- 3a. SAME_EPISODE edges ---
    for (const ep of episodes) {
      const epEvents = healthEvents.filter((e) => e.episodeId === ep.id);
      for (let i = 0; i < epEvents.length; i++) {
        for (let j = i + 1; j < epEvents.length; j++) {
          addEdge(epEvents[i]!.id, epEvents[j]!.id, 'SAME_EPISODE', 1.0);
        }
      }
    }

    // --- 3b. OCCURRED_WITH edges (same-day events) ---
    const eventsByDay = new Map<string, string[]>();
    for (const evt of healthEvents) {
      const dayKey = evt.timestamp.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!eventsByDay.has(dayKey)) eventsByDay.set(dayKey, []);
      eventsByDay.get(dayKey)!.push(evt.id);
    }

    for (const dayEvents of eventsByDay.values()) {
      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          addEdge(
            dayEvents[i]!,
            dayEvents[j]!,
            'OCCURRED_WITH',
            1.0,
          );
        }
      }
    }

    // --- 3c. PRECEDED edges (events within 14 days, chronological) ---
    for (let i = 0; i < healthEvents.length; i++) {
      for (let j = i + 1; j < healthEvents.length; j++) {
        const evtA = healthEvents[i]!;
        const evtB = healthEvents[j]!;
        const daysDiff =
          (evtB.timestamp.getTime() - evtA.timestamp.getTime()) / MS_PER_DAY;

        if (daysDiff > 0 && daysDiff <= 14) {
          // Strength inversely proportional to time gap
          const strength = Math.round((1 - daysDiff / 14) * 100) / 100;
          addEdge(evtA.id, evtB.id, 'PRECEDED', strength);
        }
      }
    }

    // --- 3d. TEMPORAL_ASSOCIATION: medication change → symptom within 10 days ---
    const medChangeEvents = healthEvents.filter((e) =>
      ['MEDICATION_STARTED', 'MEDICATION_STOPPED', 'MEDICATION_CHANGED'].includes(
        e.type,
      ),
    );
    const symptomEvents = healthEvents.filter((e) =>
      ['SYMPTOM', 'FALL', 'COGNITIVE_CHANGE', 'FUNCTIONAL_CHANGE'].includes(
        e.type,
      ),
    );

    for (const medEvt of medChangeEvents) {
      for (const symEvt of symptomEvents) {
        const daysDiff =
          (symEvt.timestamp.getTime() - medEvt.timestamp.getTime()) /
          MS_PER_DAY;

        if (daysDiff > 0 && daysDiff <= 10) {
          const strength = Math.round((1 - daysDiff / 10) * 100) / 100;
          addEdge(
            medEvt.id,
            symEvt.id,
            'TEMPORAL_ASSOCIATION',
            strength,
          );
        }
      }
    }

    // ------------------------------------------------------------------
    // 4. Return graph
    // ------------------------------------------------------------------
    const graph: HealthGraph = {
      patientId,
      nodes,
      edges,
    };

    this.logger.log(
      `Health graph for patient ${patientId}: ${nodes.length} nodes, ${edges.length} edges`,
    );

    return { data: graph };
  }
}
