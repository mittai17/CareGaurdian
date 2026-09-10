import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateConditionDto } from './dto/create-condition.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ConditionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(patientId: string, dto: CreateConditionDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'condition',
      'create condition',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const condition = await this.prisma.condition.create({
      data: {
        patientId,
        name: dto.name,
        code: dto.code ?? null,
        codeSystem: dto.codeSystem ?? null,
        diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : null,
        status: dto.status ?? 'ACTIVE',
        notes: dto.notes ?? null,
        sourceId: dto.sourceId ?? null,
      },
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_CONDITION',
      resourceType: 'Condition',
      resourceId: condition.id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(condition);
  }

  async findByPatient(patientId: string, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'condition',
      'list conditions',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const conditions = await this.prisma.condition.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    return conditions.map((c) => this.serialize(c));
  }

  async update(id: string, dto: UpdateConditionDto, currentUser: RequestUser) {
    const existing = await this.prisma.condition.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Condition not found');
    }

    const allowed = await this.accessControl.check(
      currentUser,
      existing.patientId,
      'WRITE',
      'condition',
      'update condition',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this condition');
    }

    const data: Prisma.ConditionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.codeSystem !== undefined) data.codeSystem = dto.codeSystem;
    if (dto.diagnosedAt !== undefined) data.diagnosedAt = new Date(dto.diagnosedAt);
    if (dto.resolvedAt !== undefined) data.resolvedAt = new Date(dto.resolvedAt);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.verificationStatus !== undefined)
      data.verificationStatus = dto.verificationStatus as 'REPORTED';
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.condition.update({ where: { id }, data });

    await this.audit.log({
      actorId: currentUser.id,
      patientId: existing.patientId,
      action: 'UPDATE_CONDITION',
      resourceType: 'Condition',
      resourceId: id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(updated);
  }

  private serialize(c: {
    id: string;
    patientId: string;
    name: string;
    code: string | null;
    codeSystem: string | null;
    diagnosedAt: Date | null;
    resolvedAt: Date | null;
    status: string;
    verificationStatus: string;
    notes: string | null;
    createdAt: Date;
  }) {
    return {
      id: c.id,
      patientId: c.patientId,
      name: c.name,
      code: c.code,
      codeSystem: c.codeSystem,
      diagnosedAt: c.diagnosedAt?.toISOString() ?? null,
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
      status: c.status,
      verificationStatus: c.verificationStatus,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
    };
  }
}
