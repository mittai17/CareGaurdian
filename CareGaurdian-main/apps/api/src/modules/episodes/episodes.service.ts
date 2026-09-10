import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ConfidenceLevel, Severity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';

/**
 * Build an episode "signature" — a set of string tokens derived from
 * event types, medication names, and description keywords.
 * Used for episode matching.
 */
function buildEpisodeSignature(
  events: Array<{
    type: string;
    description: string | null;
    metadata: Prisma.JsonValue;
  }>,
  episodeMedications: string[],
): Set<string> {
  const signature = new Set<string>();

  // Medication names from episode record
  for (const med of episodeMedications) {
    signature.add(`med:${med.toLowerCase()}`);
  }

  for (const event of events) {
    // Event type token
    signature.add(`type:${event.type}`);

    // Medication from event metadata
    const meta = event.metadata as Record<string, unknown>;
    if (
      meta.medicationName !== undefined &&
      meta.medicationName !== null
    ) {
      signature.add(`med:${String(meta.medicationName).toLowerCase()}`);
    }
    if (meta.medication !== undefined && meta.medication !== null) {
      signature.add(`med:${String(meta.medication).toLowerCase()}`);
    }

    // Description keywords (top 5 words > 3 chars)
    if (event.description) {
      const words = event.description
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      for (const word of words.slice(0, 5)) {
        signature.add(`kw:${word}`);
      }
    }
  }

  return signature;
}

/**
 * Cosine-ish similarity: |intersection| / sqrt(|A| * |B|)
 * Returns 0 when either set is empty.
 */
function computeSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  return intersection / Math.sqrt(setA.size * setB.size);
}

@Injectable()
export class EpisodesService {
  private readonly logger = new Logger(EpisodesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create an Episode and optionally attach existing HealthEvents
   * within a specified date range.
   */
  async create(patientId: string, dto: CreateEpisodeDto) {
    const episode = await this.prisma.$transaction(async (tx) => {
      const ep = await tx.episode.create({
        data: {
          patientId,
          title: dto.title,
          description: dto.description ?? null,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          outcome: dto.outcome as string | null,
          severity: (dto.severity as Severity) ?? null,
          symptoms: dto.symptoms ?? [],
          medicationsInvolved: dto.medicationsInvolved ?? [],
          functionalChanges: dto.functionalChanges ?? [],
          cognitiveChanges: dto.cognitiveChanges ?? [],
        },
      });

      // Optionally attach HealthEvents within the date range
      if (dto.attachEventsFrom && dto.attachEventsTo) {
        await tx.healthEvent.updateMany({
          where: {
            patientId,
            timestamp: {
              gte: new Date(dto.attachEventsFrom),
              lte: new Date(dto.attachEventsTo),
            },
            episodeId: null, // only unattached events
          },
          data: {
            episodeId: ep.id,
          },
        });
      }

      return ep;
    });

    await this.auditService.log({
      patientId,
      action: 'CREATE_EPISODE',
      resourceType: 'Episode',
      resourceId: episode.id,
      purpose: 'CARE',
      result: 'SUCCESS',
      metadata: { title: dto.title },
    });

    return { data: this.serialize(episode) };
  }

  /** List all episodes for a patient, newest first. */
  async list(patientId: string) {
    const episodes = await this.prisma.episode.findMany({
      where: { patientId },
      orderBy: { startDate: 'desc' },
      include: { events: { select: { id: true } } },
    });

    return {
      data: episodes.map((ep) => ({
        ...this.serialize(ep),
        eventCount: ep.events.length,
      })),
    };
  }

  /** Get a single episode by ID. */
  async getById(id: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
      include: { events: true },
    });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }
    return { data: this.serialize(episode) };
  }

  /**
   * Match the current 14-day event window against all past episodes
   * using a set-based similarity metric.
   *
   * Returns up to 3 matches with score >= 0.4.
   */
  async matchCurrent(patientId: string) {
    const now = new Date();
    const fourteenDaysAgo = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000,
    );

    // 1. Current window events
    const currentEvents = await this.prisma.healthEvent.findMany({
      where: {
        patientId,
        timestamp: { gte: fourteenDaysAgo, lte: now },
      },
    });

    if (currentEvents.length === 0) {
      return { data: [] };
    }

    const currentSignature = buildEpisodeSignature(currentEvents, []);

    // 2. Past episodes (before the current window)
    const pastEpisodes = await this.prisma.episode.findMany({
      where: {
        patientId,
        startDate: { lt: fourteenDaysAgo },
      },
      include: { events: true },
    });

    // 3. Score each past episode
    interface MatchResult {
      similarityScore: number;
      matchedEpisodeId: string;
      matchedEpisodeTitle: string;
      matchingSignals: string[];
      missingSignals: string[];
      confidence: ConfidenceLevel;
      matchedAt: string;
    }

    const matches: MatchResult[] = [];

    for (const ep of pastEpisodes) {
      const epSignature = buildEpisodeSignature(
        ep.events,
        ep.medicationsInvolved,
      );
      const similarity = computeSimilarity(currentSignature, epSignature);

      if (similarity >= 0.4) {
        const matchingSignals = [...currentSignature].filter((s) =>
          epSignature.has(s),
        );
        const missingSignals = [...epSignature].filter(
          (s) => !currentSignature.has(s),
        );

        let confidence: ConfidenceLevel;
        if (similarity >= 0.7) confidence = 'HIGH';
        else if (similarity >= 0.55) confidence = 'MODERATE';
        else confidence = 'LOW';

        matches.push({
          similarityScore:
            Math.round(similarity * 1000) / 1000,
          matchedEpisodeId: ep.id,
          matchedEpisodeTitle: ep.title,
          matchingSignals,
          missingSignals,
          confidence,
          matchedAt: now.toISOString(),
        });
      }
    }

    // 4. Return top 3 by similarity
    const topMatches = matches
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3);

    return { data: topMatches };
  }

  // -----------------------------------------------------------------------
  // Exposed for unit testing
  // -----------------------------------------------------------------------

  computeSimilarity(setA: Set<string>, setB: Set<string>): number {
    return computeSimilarity(setA, setB);
  }

  buildEpisodeSignature(
    events: Array<{
      type: string;
      description: string | null;
      metadata: Prisma.JsonValue;
    }>,
    episodeMedications: string[],
  ): Set<string> {
    return buildEpisodeSignature(events, episodeMedications);
  }

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  private serialize(episode: {
    id: string;
    patientId: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    outcome: string | null;
    severity: string | null;
    symptoms: string[];
    medicationsInvolved: string[];
    functionalChanges: string[];
    cognitiveChanges: string[];
    createdAt: Date;
    events?: unknown[];
  }) {
    return {
      id: episode.id,
      patientId: episode.patientId,
      title: episode.title,
      description: episode.description,
      startDate: episode.startDate.toISOString(),
      endDate: episode.endDate ? episode.endDate.toISOString() : null,
      outcome: episode.outcome,
      severity: episode.severity,
      symptoms: episode.symptoms,
      medicationsInvolved: episode.medicationsInvolved,
      functionalChanges: episode.functionalChanges,
      cognitiveChanges: episode.cognitiveChanges,
      createdAt: episode.createdAt.toISOString(),
    };
  }
}
