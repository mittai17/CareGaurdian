import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class LabResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(patientId: string, dto: CreateLabResultDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'WRITE',
      'lab-result',
      'create lab result',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const labResult = await this.prisma.labResult.create({
      data: {
        patientId,
        testName: dto.testName,
        value: dto.value,
        unit: dto.unit ?? null,
        referenceRange: dto.referenceRange ?? null,
        collectedAt: new Date(dto.collectedAt),
        interpretation: dto.interpretation ?? null,
        sourceId: dto.sourceId ?? null,
      },
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId,
      action: 'CREATE_LAB_RESULT',
      resourceType: 'LabResult',
      resourceId: labResult.id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(labResult);
  }

  async findByPatient(patientId: string, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      patientId,
      'READ',
      'lab-result',
      'list lab results',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const results = await this.prisma.labResult.findMany({
      where: { patientId },
      orderBy: { collectedAt: 'desc' },
    });

    return results.map((r) => this.serialize(r));
  }

  async findById(id: string, currentUser: RequestUser) {
    const labResult = await this.prisma.labResult.findUnique({ where: { id } });
    if (!labResult) {
      throw new NotFoundException('Lab result not found');
    }

    const allowed = await this.accessControl.check(
      currentUser,
      labResult.patientId,
      'READ',
      'lab-result',
      'view lab result',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this lab result');
    }

    return this.serialize(labResult);
  }

  private serialize(r: {
    id: string;
    patientId: string;
    testName: string;
    value: string;
    unit: string | null;
    referenceRange: string | null;
    collectedAt: Date;
    interpretation: string | null;
    createdAt: Date;
  }) {
    return {
      id: r.id,
      patientId: r.patientId,
      testName: r.testName,
      value: r.value,
      unit: r.unit,
      referenceRange: r.referenceRange,
      collectedAt: r.collectedAt.toISOString(),
      interpretation: r.interpretation,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
