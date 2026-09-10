import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class EncountersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(patientId: string, dto: CreateEncounterDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'encounter',
      'create encounter',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const encounter = await this.prisma.encounter.create({
      data: {
        patientId,
        type: dto.type,
        providerName: dto.providerName ?? null,
        reason: dto.reason ?? null,
        startedAt: new Date(dto.startedAt),
        endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
        location: dto.location ?? null,
        notes: dto.notes ?? null,
      },
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_ENCOUNTER',
      resourceType: 'Encounter',
      resourceId: encounter.id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(encounter);
  }

  async findByPatient(patientId: string, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'encounter',
      'list encounters',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const encounters = await this.prisma.encounter.findMany({
      where: { patientId },
      orderBy: { startedAt: 'desc' },
    });

    return encounters.map((e) => this.serialize(e));
  }

  private serialize(e: {
    id: string;
    patientId: string;
    providerName: string | null;
    type: string;
    reason: string | null;
    startedAt: Date;
    endedAt: Date | null;
    location: string | null;
    notes: string | null;
    createdAt: Date;
  }) {
    return {
      id: e.id,
      patientId: e.patientId,
      providerName: e.providerName,
      type: e.type,
      reason: e.reason,
      startedAt: e.startedAt.toISOString(),
      endedAt: e.endedAt?.toISOString() ?? null,
      location: e.location,
      notes: e.notes,
      createdAt: e.createdAt.toISOString(),
    };
  }
}
