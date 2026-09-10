import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModuleGlobal } from './config/config.module';
import { AccessControlModule } from './common/services/access-control.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { HealthEventsModule } from './modules/health-events/health-events.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { ObservationsModule } from './modules/observations/observations.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { GuardianModule } from './modules/guardians/guardians.module';
import { HealthMemoryModule } from './modules/memory/health-memory.module';
import { ConditionsModule } from './modules/conditions/conditions.module';
import { AllergiesModule } from './modules/allergies/allergies.module';
import { EncountersModule } from './modules/encounters/encounters.module';
import { LabResultsModule } from './modules/lab-results/lab-results.module';
import { HealthGraphModule } from './modules/health-graph/health-graph.module';
import { ContradictionsModule } from './modules/contradictions/contradictions.module';
import { MissingInformationModule } from './modules/missing-information/missing-info.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BaselinesModule } from './modules/baselines/baselines.module';
import { EpisodesModule } from './modules/episodes/episodes.module';
import { ChangeDetectionModule } from './modules/change-detection/change-detection.module';
import { RoleModule } from './modules/roles/roles.module';
import { ConsentModule } from './modules/consent/consent.module';
import { AuditModule } from './modules/audit/audit.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { AiModule } from './modules/ai/ai.module';
import { BriefModule } from './modules/brief/brief.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    PrismaModule,
    ConfigModuleGlobal,
    AccessControlModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    HealthEventsModule,
    TimelineModule,
    ObservationsModule,
    MedicationsModule,
    GuardianModule,
    HealthMemoryModule,
    ConditionsModule,
    AllergiesModule,
    EncountersModule,
    LabResultsModule,
    HealthGraphModule,
    ContradictionsModule,
    MissingInformationModule,
    NotificationsModule,
    BaselinesModule,
    EpisodesModule,
    ChangeDetectionModule,
    RoleModule,
    ConsentModule,
    AuditModule,
    DocumentsModule,
    EmergencyModule,
    AiModule,
    BriefModule,
    MessagesModule,
  ],
})
export class AppModule {}