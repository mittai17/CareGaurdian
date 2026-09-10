import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/services/access-control.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreatePatientDto, currentUser: RequestUser) {
    const patient = await this.prisma.patient.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        address: dto.address ?? null,
        emergencyContactName: dto.emergencyContactName ?? null,
        emergencyContactPhone: dto.emergencyContactPhone ?? null,
        timezone: dto.timezone ?? 'UTC',
        preferredLanguage: dto.preferredLanguage ?? 'en',
        createdById: currentUser.id,
        // Link the creator to the patient
        users: {
          create: {
            userId: currentUser.id,
            role: currentUser.roles.includes('CLINICIAN')
              ? 'CLINICIAN'
              : currentUser.roles.includes('ADMIN')
                ? 'ADMIN'
                : 'FAMILY_CAREGIVER',
          },
        },
      },
      include: {
        users: true,
      },
    });

    await this.audit.log({
      actorId: currentUser.id,
      patientId: patient.id,
      action: 'CREATE_PATIENT',
      resourceType: 'Patient',
      resourceId: patient.id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(patient);
  }

  async findAll(currentUser: RequestUser) {
    const isAdmin = currentUser.roles.includes('ADMIN');
    const isClinician = currentUser.roles.includes('CLINICIAN');
    const isPharmacist = currentUser.roles.includes('PHARMACIST');

    if (isAdmin) {
      const patients = await this.prisma.patient.findMany({ orderBy: { lastName: 'asc' } });
      return patients.map((p) => this.serialize(p));
    }

    if (isClinician || isPharmacist) {
      // Primary: patients directly linked to this user
      const directRels = await this.prisma.patientUserRelationship.findMany({
        where: { userId: currentUser.id },
        include: { patient: true },
      });
      if (directRels.length > 0) {
        return directRels.map((r) => this.serialize(r.patient));
      }

      // Fallback: patients in the user's org
      if (currentUser.organizationId) {
        const orgRels = await this.prisma.patientOrganizationRelationship.findMany({
          where: { organizationId: currentUser.organizationId, status: 'ACTIVE' },
          include: { patient: true },
        });
        return orgRels.map((r) => this.serialize(r.patient));
      }

      return [];
    }

    // Guardians, caregivers, patients: see patients they are linked to
    const userRels = await this.prisma.patientUserRelationship.findMany({
      where: { userId: currentUser.id },
      include: { patient: true },
    });
    return userRels.map((r) => this.serialize(r.patient));
  }

  async findById(id: string, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      id,
      'READ',
      'patient',
      'view patient',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return this.serialize(patient);
  }

  async update(id: string, dto: UpdatePatientDto, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      id,
      'WRITE',
      'patient',
      'update patient',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const existing = await this.prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Patient not found');
    }

    const data: Prisma.PatientUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.emergencyContactName !== undefined) data.emergencyContactName = dto.emergencyContactName;
    if (dto.emergencyContactPhone !== undefined) data.emergencyContactPhone = dto.emergencyContactPhone;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.preferredLanguage !== undefined) data.preferredLanguage = dto.preferredLanguage;

    const updated = await this.prisma.patient.update({ where: { id }, data });

    await this.audit.log({
      actorId: currentUser.id,
      patientId: id,
      action: 'UPDATE_PATIENT',
      resourceType: 'Patient',
      resourceId: id,
      purpose: 'CARE',
      result: 'SUCCESS',
    });

    return this.serialize(updated);
  }

  async getSummary(id: string, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(
      currentUser,
      id,
      'READ',
      'patient',
      'view patient summary',
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const [
      conditionsCount,
      medicationsCount,
      healthEventsCount,
      lastObservation,
    ] = await Promise.all([
      this.prisma.condition.count({ where: { patientId: id, status: 'ACTIVE' } }),
      this.prisma.medication.count({ where: { patientId: id, status: 'ACTIVE' } }),
      this.prisma.healthEvent.count({ where: { patientId: id } }),
      this.prisma.observation.findFirst({
        where: { patientId: id },
        orderBy: { occurredAt: 'desc' },
        select: {
          id: true,
          category: true,
          severity: true,
          occurredAt: true,
        },
      }),
    ]);

    return {
      patient: this.serialize(patient),
      summary: {
        activeConditions: conditionsCount,
        activeMedications: medicationsCount,
        totalHealthEvents: healthEventsCount,
        lastObservation: lastObservation
          ? {
              ...lastObservation,
              occurredAt: lastObservation.occurredAt.toISOString(),
            }
          : null,
      },
    };
  }

  async getCareCircle(patientId: string, currentUser: RequestUser) {
    const allowed = await this.accessControl.check(currentUser, patientId, 'READ', 'patient', 'view care circle');
    if (!allowed) throw new ForbiddenException('Access denied');

    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const members = await this.prisma.patientUserRelationship.findMany({
      where: { patientId },
      include: {
        user: {
          select: { id: true, name: true, email: true, roles: true },
        },
      },
    });

    const result = await Promise.all(members.map(async (m) => {
      const obsCount = await this.prisma.observation.count({
        where: { patientId, sourceUserId: m.userId },
      });
      const lastObs = await this.prisma.observation.findFirst({
        where: { patientId, sourceUserId: m.userId },
        orderBy: { occurredAt: 'desc' },
        select: { occurredAt: true },
      });
      return {
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        roles: m.user.roles,
        relationshipType: m.role,
        observationCount: obsCount,
        lastObservationAt: lastObs?.occurredAt?.toISOString() ?? null,
      };
    }));

    return result;
  }

  private serialize(patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    timezone: string;
    preferredLanguage: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth.toISOString(),
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      timezone: patient.timezone,
      preferredLanguage: patient.preferredLanguage,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
    };
  }
}
