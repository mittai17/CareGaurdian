import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateMemoryFactDto } from './dto/create-memory-fact.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(patientId: string, dto: CreateMemoryFactDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'memory',
      'create memory fact',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const fact = await this.prisma.healthMemoryFact.create({
      data: {
        patientId,
        memoryType: dto.memoryType as 'FACT',
        category: dto.category,
        content: dto.content,
        provenance: dto.provenance as unknown as Prisma.InputJsonValue,
        sourceId: dto.sourceId ?? null,
      },
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_MEMORY_FACT',
      resourceType: 'HealthMemoryFact',
      resourceId: fact.id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(fact);
  }

  async findByPatient(
    patientId: string,
    currentUser: RequestUser,
    filters: { memoryType?: string; category?: string },
  ) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'memory',
      'list memory facts',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const where: Prisma.HealthMemoryFactWhereInput = { patientId };
    if (filters.memoryType) {
      where.memoryType = { equals: filters.memoryType as 'FACT' };
    }
    if (filters.category) {
      where.category = filters.category;
    }

    const facts = await this.prisma.healthMemoryFact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return facts.map((f) => this.serialize(f));
  }

  async findById(id: string, currentUser: RequestUser) {
    const fact = await this.prisma.healthMemoryFact.findUnique({ where: { id } });
    if (!fact) {
      throw new NotFoundException('Memory fact not found');
    }

    const allowed = await this.accessControl.check(
      currentUser,
      fact.patientId,
      'READ',
      'memory',
      'view memory fact',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this memory fact');
    }

    return this.serialize(fact);
  }

  private serialize(fact: {
    id: string;
    patientId: string;
    memoryType: string;
    category: string;
    content: string;
    provenance: Prisma.JsonValue;
    sourceId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: fact.id,
      patientId: fact.patientId,
      memoryType: fact.memoryType,
      category: fact.category,
      content: fact.content,
      provenance: fact.provenance as Record<string, unknown>,
      sourceId: fact.sourceId,
      createdAt: fact.createdAt.toISOString(),
      updatedAt: fact.updatedAt.toISOString(),
    };
  }
}
