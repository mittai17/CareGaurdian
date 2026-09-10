/**
 * AI Controller — REST endpoints for AI analysis operations.
 * All endpoints require bearer authentication (global guard).
 */

import { Controller, Post, Body, Param, ParseUUIDPipe, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('AI Analysis')
@ApiBearerAuth()
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/analyze-event
   * Trigger the full analysis pipeline for a patient.
   */
  @Post('ai/analyze-event')
  @ApiOperation({
    summary: 'Run the full AI analysis pipeline for a patient',
    description: 'Executes baseline → change → medication → cognitive → functional → episode → evidence → safety → consensus → output',
  })
  async analyzeEvent(
    @Body() body: { patientId: string; eventId?: string; sourceText?: string },
    @CurrentUser() user: RequestUser,
  ) {
    if (!body.patientId) {
      throw new BadRequestException('patientId is required');
    }

    const result = await this.aiService.runAnalysis(
      body.patientId,
      user.id,
      body.eventId ?? undefined,
    );

    return { data: result };
  }

  /**
   * POST /ai/clinical-brief
   * Build a clinical brief for a patient.
   */
  @Post('ai/clinical-brief')
  @ApiOperation({
    summary: 'Build a clinical brief for a patient',
    description: 'Assembles overall state, why now, historical matches, evidence, contradictions, and data gaps',
  })
  async clinicalBrief(
    @Body() body: { patientId: string },
    @CurrentUser() user: RequestUser,
  ) {
    if (!body.patientId) {
      throw new BadRequestException('patientId is required');
    }

    // Import BriefService lazily to avoid circular deps
    const { BriefService } = await import('../brief/brief.service');
    // BriefService will be injected by NestJS in its own module,
    // but for this cross-module call we use the AiService's prisma
    // to build the brief directly (avoids circular module dependency).
    // In production, this would be an internal RPC or the BriefService
    // would be injected via a shared provider.
    // For now, we delegate to a simple inline implementation.
    return { data: await this.buildBriefInline(body.patientId) };
  }

  /**
   * POST /ai/query
   * RAG-lite query against patient documents.
   */
  @Post('ai/query')
  @ApiOperation({
    summary: 'Query patient data using keyword search + LLM',
    description: 'Searches observations, health events, documents, and memory facts, then generates an answer',
  })
  async query(
    @Body() body: { patientId: string; question: string },
    @CurrentUser() user: RequestUser,
  ) {
    if (!body.patientId) {
      throw new BadRequestException('patientId is required');
    }
    if (!body.question) {
      throw new BadRequestException('question is required');
    }

    const result = await this.aiService.query(
      body.patientId,
      body.question,
      user.id,
    );

    return { data: result };
  }

  // ---------------------------------------------------------------------------
  // Inline brief builder (avoids circular dependency with BriefModule)
  // ---------------------------------------------------------------------------

  private async buildBriefInline(patientId: string) {
    // Access prisma via the service's private field (NestJS DI)
     
    const prisma = (this.aiService as any).prisma as import('../../prisma/prisma.service').PrismaService;

    // Latest risk signal
    const latestSignal = await prisma.riskSignal.findFirst({
      where: { patientId },
      orderBy: { generatedAt: 'desc' },
    });

    // Episodes
    const episodes = await prisma.episode.findMany({
      where: { patientId },
      orderBy: { startDate: 'desc' },
      take: 10,
    });

    // Evidence
    const evidence = await prisma.evidence.findMany({
      where: { riskSignal: { patientId } },
      orderBy: { recordedAt: 'desc' },
      take: 20,
    });

    // Contradictions
    const contradictions = await prisma.contradiction.findMany({
      where: { patientId, status: 'OPEN' },
    });

    // Missing info (Prisma model: MissingInformation → accessor: missingInformation)
    const dataGaps = await (prisma as any).missingInformation.findMany({
      where: { patientId, status: 'OPEN' },
    });

    return {
      patientId,
      overallState: latestSignal ? latestSignal['severity'] : 'NORMAL',
      whyNow: latestSignal && Array.isArray(latestSignal['whyNow'])
        ? (latestSignal['whyNow'] as string[])
        : ['No recent changes detected'],
      historicalMatches: episodes.slice(0, 5).map((ep) => ({
        episodeId: ep['id'] as string,
        title: ep['title'] as string,
        similarity: 0.5,
      })),
      evidence: evidence.map((e) => `[${e['sourceType']}] ${e['claim']}`),
      contradictions: contradictions.map((c) => ({
        id: c['id'],
        type: c['type'],
        description: c['description'],
        evidenceA: c['evidenceA'],
        evidenceB: c['evidenceB'],
        detectedAt: (c['detectedAt'] as Date).toISOString(),
        status: c['status'],
        confidence: c['confidence'],
      })),
      dataGaps: dataGaps.map((d: Record<string, unknown>) => ({
        id: d['id'],
        patientId: d['patientId'],
        category: d['category'],
        description: d['description'],
        severity: d['severity'],
        detectedAt: (d['detectedAt'] as Date).toISOString(),
        status: d['status'],
      })),
      confidence: latestSignal ? latestSignal['confidenceLevel'] : 'INSUFFICIENT_DATA',
      status: 'GENERATED',
      generatedAt: new Date().toISOString(),
    };
  }
}
