import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AllergiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(patientId: string, dto: CreateAllergyDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'allergy',
      'create allergy',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const allergy = await this.prisma.allergy.create({
      data: {
        patientId,
        allergen: dto.allergen,
        reaction: dto.reaction ?? null,
        severity: dto.severity ?? null,
        sourceId: dto.sourceId ?? null,
      },
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_ALLERGY',
      resourceType: 'Allergy',
      resourceId: allergy.id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(allergy);
  }

  async findByPatient(patientId: string, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'allergy',
      'list allergies',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const allergies = await this.prisma.allergy.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    return allergies.map((a) => this.serialize(a));
  }

  async update(id: string, dto: UpdateAllergyDto, currentUser: RequestUser) {
    const existing = await this.prisma.allergy.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Allergy not found');
    }

    const allowed = await this.accessControl.check(
      currentUser,
      existing.patientId,
      'WRITE',
      'allergy',
      'update allergy',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this allergy');
    }

    const data: Prisma.AllergyUpdateInput = {};
    if (dto.allergen !== undefined) data.allergen = dto.allergen;
    if (dto.reaction !== undefined) data.reaction = dto.reaction;
    if (dto.severity !== undefined) data.severity = dto.severity;
    if (dto.verificationStatus !== undefined)
      data.verificationStatus = dto.verificationStatus as 'REPORTED';

    const updated = await this.prisma.allergy.update({ where: { id }, data });

    await this.audit.log({
      actorId: currentUser.id,
      patientId: existing.patientId,
      action: 'UPDATE_ALLERGY',
      resourceType: 'Allergy',
      resourceId: id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(updated);
  }

  private serialize(a: {
    id: string;
    patientId: string;
    allergen: string;
    reaction: string | null;
    severity: string | null;
    recordedAt: Date;
    verificationStatus: string;
    createdAt: Date;
  }) {
    return {
      id: a.id,
      patientId: a.patientId,
      allergen: a.allergen,
      reaction: a.reaction,
      severity: a.severity,
      recordedAt: a.recordedAt.toISOString(),
      verificationStatus: a.verificationStatus,
      createdAt: a.createdAt.toISOString(),
    };
  }
}
