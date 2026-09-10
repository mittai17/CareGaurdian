/**
 * BASELINE — Seed script
 *
 * Creates the synthetic demo environment required by the product demo:
 *  - A multi-year "persistent health memory" for Robert Miller (82)
 *  - Real clinical records (conditions, allergies, medications, labs,
 *    encounters, assessments, documents)
 *  - Historical episodes (2023 ankle-sprain fall, 2025 decline + fall +
 *    hospitalization that mirrors the CURRENT pattern)
 *  - A CURRENT window (last 7 days) where the caregiver reports confusion,
 *    poor appetite, near-fall — after two NEW medications were started.
 *
 * After seeding raw records, the script BOOTS THE REAL PIPELINE:
 *  1. BaselinesService.getOrCompute  (baseline from 90d of history)
 *  2. ChangeDetectionService.detect  (current window vs baseline)
 *  3. EpisodesService.matchCurrent   (match current pattern to 2025 episode)
 *  4. ContradictionsService.detect   (allergy conflict, duplicate conditions)
 *  5. MissingInfoService.detect      (fall-risk / reconciliation / cognition /
 *                                     post-discharge gaps)
 * All derived outputs come from the real engines — nothing is fabricated.
 *
 * Run with: pnpm --filter @baseline/api prisma:seed
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { BaselinesService } from '../src/modules/baselines/baselines.service';
import { ChangeDetectionService } from '../src/modules/change-detection/change-detection.service';
import { EpisodesService } from '../src/modules/episodes/episodes.service';
import { ContradictionsService } from '../src/modules/contradictions/contradictions.service';
import { MissingInfoService } from '../src/modules/missing-information/missing-info.service';
import { BriefService } from '../src/modules/brief/brief.service';
import { AiService } from '../src/modules/ai/ai.service';

const logger = new Logger('Seed');
const prisma = new PrismaClient();

// Progress watchdog — if the loop drains silently (pending promise with no
// active handles), report *where* we stalled instead of exiting quietly.
let lastProgress = Date.now();
let progressLabel = 'start';
const watchdog = setInterval(() => {
  if (Date.now() - lastProgress > 30000) {
    logger.error(`STALLED at '${progressLabel}' after 30s idle`);
    process.exit(3);
  }
}, 5000);
watchdog.unref();
const step = (label: string) => {
  lastProgress = Date.now();
  progressLabel = label;
  process.stdout.write(`[step] ${label}\n`);
  Promise.resolve().catch(() => undefined);
};

process.on('unhandledRejection', (r) => {
  logger.error(`UNHANDLED REJECTION: ${r instanceof Error ? r.stack : String(r)}`);
  process.exit(1);
});
process.on('uncaughtException', (e) => {
  logger.error(`UNCAUGHT EXCEPTION: ${e.stack ?? e.message}`);
  process.exit(1);
});

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY);
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR);

// ---------------------------------------------------------------------------
// Reference IDs resolved during seeding
// ---------------------------------------------------------------------------
let PATIENT_ID = '';
let SARAH_ID = '';
let MARIA_ID = '';
let DRCHEN_ID = '';
let PHARM_ID = '';
let DRPARK_ID = '';
let ADMIN_ID = '';
let MED_SERTRALINE = '';
let MED_AMOXICILLIN = '';
let EVENT_SERT_START = '';

interface UserSeed {
  email: string;
  name: string;
  roles: string[];
  passwordHash: string;
}

async function hashPassword(): Promise<string> {
  return bcrypt.hash('demo1234', 10);
}

// ---------------------------------------------------------------------------
// PHASE 1 — Foundation: users, organizations, patient, relationships, consents
// ---------------------------------------------------------------------------
async function phase1() {
  logger.log('Phase 1 — users / org / patient / consents');

  const pass = await hashPassword();

  const users: UserSeed[] = [
    { email: 'robert.patient@baseline.demo', name: 'Robert Miller', roles: ['PATIENT'], passwordHash: pass },
    { email: 'sarah.daughter@baseline.demo', name: 'Sarah Miller', roles: ['GUARDIAN', 'FAMILY_CAREGIVER'], passwordHash: pass },
    { email: 'maria.pelletier@baseline.demo', name: 'Maria Pelletier', roles: ['PROFESSIONAL_CAREGIVER'], passwordHash: pass },
    { email: 'drchen@baseline.demo', name: 'Dr. Elena Chen', roles: ['CLINICIAN'], passwordHash: pass },
    { email: 'pharm.patel@baseline.demo', name: 'Priya Patel (Pharmacist)', roles: ['PHARMACIST'], passwordHash: pass },
    { email: 'drpark@baseline.demo', name: 'Dr. Marcus Park (ED)', roles: ['EMERGENCY_CLINICIAN'], passwordHash: pass },
    { email: 'admin@baseline.demo', name: 'Baseline Admin', roles: ['ADMIN'], passwordHash: pass },
  ];

  const created: Record<string, string> = {};
  for (const u of users) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { roles: u.roles as never },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: u.passwordHash,
        roles: u.roles as never,
      },
    });
    created[u.email] = row.id;
  }

  SARAH_ID = created['sarah.daughter@baseline.demo']!;
  MARIA_ID = created['maria.pelletier@baseline.demo']!;
  DRCHEN_ID = created['drchen@baseline.demo']!;
  PHARM_ID = created['pharm.patel@baseline.demo']!;
  DRPARK_ID = created['drpark@baseline.demo']!;
  ADMIN_ID = created['admin@baseline.demo']!;

  // Organization
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-4000-8000-0000000000org' },
    update: {},
    create: { id: '00000000-0000-4000-8000-0000000000org', name: 'Sunrise Senior Care' },
  });

  await prisma.organizationMembership.createMany({
    data: [
      { organizationId: org.id, userId: DRCHEN_ID, role: 'CLINICIAN' },
      { organizationId: org.id, userId: MARIA_ID, role: 'PROFESSIONAL_CAREGIVER' },
    ],
    skipDuplicates: true,
  });

  // Patient Robert Miller — 82 years old
  const patient = await prisma.patient.upsert({
    where: { id: '00000000-0000-4000-8000-0000000000ab' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-0000000000ab',
      firstName: 'Robert',
      lastName: 'Miller',
      dateOfBirth: new Date('1944-03-15'),
      gender: 'male',
      phone: '+1 (555) 214-8890',
      email: 'robert.patient@baseline.demo',
      address: '28 Maple Lane, Springfield',
      emergencyContactName: 'David Miller (son)',
      emergencyContactPhone: '+1 (555) 214-7711',
      timezone: 'America/New_York',
      preferredLanguage: 'en',
      createdById: ADMIN_ID,
    },
  });
  PATIENT_ID = patient.id;

  // Patient ←→ user relationships (RBAC scope)
  await prisma.patientUserRelationship.createMany({
    data: [
      { patientId: PATIENT_ID, userId: created['robert.patient@baseline.demo']!, role: 'PATIENT' },
      { patientId: PATIENT_ID, userId: SARAH_ID, role: 'GUARDIAN' },
      { patientId: PATIENT_ID, userId: MARIA_ID, role: 'PROFESSIONAL_CAREGIVER' },
      { patientId: PATIENT_ID, userId: DRCHEN_ID, role: 'CLINICIAN' },
      { patientId: PATIENT_ID, userId: PHARM_ID, role: 'PHARMACIST' },
      { patientId: PATIENT_ID, userId: DRPARK_ID, role: 'EMERGENCY_CLINICIAN' },
    ],
    skipDuplicates: true,
  });

  await prisma.patientOrganizationRelationship.create({
    data: {
      patientId: PATIENT_ID,
      organizationId: org.id,
      relationship: 'PRIMARY_ORG',
      status: 'ACTIVE',
    },
  });

  // Legal guardianship — Sarah (daughter)
  await prisma.guardianRelationship.create({
    data: {
      patientId: PATIENT_ID,
      guardianUserId: SARAH_ID,
      relationship: 'LEGAL_GUARDIAN',
      startsAt: new Date('2019-01-01'),
      status: 'ACTIVE',
      documentRef: 'POA-2019-0115.pdf',
    },
  });

  // Consents — Robert grants access
  const consentRecipients: Array<{ userId: string; purpose: string; scope: string[] }> = [
    { userId: SARAH_ID, purpose: 'FAMILY_CARE', scope: ['ALL'] },
    { userId: MARIA_ID, purpose: 'DAILY_CARE', scope: ['OBSERVATIONS', 'MEDICATIONS', 'SAFETY', 'BASELINE'] },
    { userId: DRCHEN_ID, purpose: 'CLINICAL_CARE', scope: ['ALL'] },
    { userId: PHARM_ID, purpose: 'MEDICATION_MANAGEMENT', scope: ['MEDICATIONS', 'ALLERGIES'] },
  ];

  for (const c of consentRecipients) {
    const consent = await prisma.consent.create({
      data: {
        patientId: PATIENT_ID,
        grantorId: created['robert.patient@baseline.demo']!,
        recipientId: c.userId,
        recipientType: 'CLINICIAN', // overwritten below in createMany style... single create
        dataScope: c.scope,
        purpose: c.purpose,
        startDate: new Date('2020-01-01'),
        status: 'ACTIVE',
      },
    });
    // fix recipientType by role lookup
    const recipient = await prisma.user.findUnique({ where: { id: c.userId } });
    await prisma.consent.update({
      where: { id: consent.id },
      data: { recipientType: recipient!.roles[0] },
    });

    await prisma.permission.createMany({
      data: [
        { consentId: consent.id, resource: 'observation', action: 'READ', allowed: true },
        { consentId: consent.id, resource: 'observation', action: 'WRITE', allowed: true },
        { consentId: consent.id, resource: 'medication', action: 'READ', allowed: true },
        { consentId: consent.id, resource: 'allergy', action: 'READ', allowed: true },
        { consentId: consent.id, resource: 'baseline', action: 'READ', allowed: true },
        { consentId: consent.id, resource: 'episode', action: 'READ', allowed: true },
        { consentId: consent.id, resource: 'lab', action: 'READ', allowed: true },
      ],
    });
  }

  logger.log(`  Patient created: ${patient.firstName} ${patient.lastName} (id=${PATIENT_ID})`);
}

// ---------------------------------------------------------------------------
// PHASE 1b — Clinical history: conditions, allergies, medications, labs
// ---------------------------------------------------------------------------
async function phase1b() {
  logger.log('Phase 1b — conditions / allergies / medications / labs / encounters / assessments');

  // Conditions (0: allow duplicate-condition contradiction via two sources)
  await prisma.condition.createMany({
    data: [
      { patientId: PATIENT_ID, name: 'Hypertension', code: 'I10', codeSystem: 'ICD-10', diagnosedAt: new Date('2010-04-12'), status: 'ACTIVE', verificationStatus: 'CLINICALLY_VERIFIED', sourceId: 'EHR:Sunrise:001', notes: 'Well controlled' },
      // Duplicate from second source → contradiction (historical duplicate)
      { patientId: PATIENT_ID, name: 'Hypertension', code: 'I10', codeSystem: 'ICD-10', diagnosedAt: new Date('2012-01-20'), status: 'ACTIVE', verificationStatus: 'DOCUMENTED', sourceId: 'EHR:StMarys:0471', notes: 'Duplicated during intake import' },
      { patientId: PATIENT_ID, name: 'Type 2 Diabetes Mellitus', code: 'E11.9', codeSystem: 'ICD-10', diagnosedAt: new Date('2014-08-05'), status: 'ACTIVE', verificationStatus: 'CLINICALLY_VERIFIED', sourceId: 'EHR:Sunrise:002' },
      { patientId: PATIENT_ID, name: 'Osteoarthritis (hips & knees)', code: 'M17', codeSystem: 'ICD-10', diagnosedAt: new Date('2016-06-17'), status: 'ACTIVE', verificationStatus: 'CLINICALLY_VERIFIED', sourceId: 'EHR:Sunrise:003' },
      { patientId: PATIENT_ID, name: 'Mild Cognitive Impairment (suspected)', code: 'G31.84', codeSystem: 'ICD-10', diagnosedAt: new Date('2023-11-02'), status: 'ACTIVE', verificationStatus: 'REPORTED', sourceId: 'EHR:Sunrise:004', notes: 'Caregiver-reported, awaiting specialist eval' },
    ],
  });

  // Allergies — amoxicillin anaphylaxis (drives ALLERGY_CONFLICT) + penicillin
  await prisma.allergy.createMany({
    data: [
      { patientId: PATIENT_ID, allergen: 'Amoxicillin', reaction: 'Anaphylaxis (throat swelling, hives)', severity: 'SEVERE', recordedAt: new Date('2011-05-22'), verificationStatus: 'CLINICALLY_VERIFIED', sourceId: 'EHR:StMarys:0112' },
      { patientId: PATIENT_ID, allergen: 'Penicillin', reaction: 'Hives, angioedema', severity: 'SEVERE', recordedAt: new Date('2011-05-22'), verificationStatus: 'DOCUMENTED', sourceId: 'EHR:StMarys:0113' },
    ],
  });

  // Medications — 12 ACTIVE (polypharmacy → reconciliation gap). Two NEW within 10 days.
  await prisma.medication.createMany({
    data: [
      { patientId: PATIENT_ID, name: 'Amoxicillin 500mg', genericName: 'amoxicillin', dosage: '500 mg', frequency: '3 times daily', route: 'oral', startedAt: daysAgo(9), status: 'ACTIVE', prescribedBy: 'Dr. Marcus Park (ED)', notes: 'Post-discharge UTI prophylaxis — FLAGGED vs amoxicillin allergy' },
      { patientId: PATIENT_ID, name: 'Sertraline 25mg', genericName: 'sertraline', dosage: '25 mg', frequency: 'once daily', route: 'oral', startedAt: daysAgo(8), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen', notes: 'New Rx — mirrors Feb 2025 decline' },
      { patientId: PATIENT_ID, name: 'Lisinopril 20mg', genericName: 'lisinopril', dosage: '20 mg', frequency: 'once daily', route: 'oral', startedAt: new Date('2016-03-10'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
      { patientId: PATIENT_ID, name: 'Metformin 1000mg', genericName: 'metformin', dosage: '1000 mg', frequency: 'twice daily', route: 'oral', startedAt: new Date('2014-08-20'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
      { patientId: PATIENT_ID, name: 'Atorvastatin 20mg', genericName: 'atorvastatin', dosage: '20 mg', frequency: 'once nightly', route: 'oral', startedAt: new Date('2010-05-15'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
      { patientId: PATIENT_ID, name: 'Warfarin 5mg', genericName: 'warfarin', dosage: '5 mg', frequency: 'once daily', route: 'oral', startedAt: new Date('2019-02-14'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen', notes: 'Fall risk: anticoagulant' },
      { patientId: PATIENT_ID, name: 'Amlodipine 5mg', genericName: 'amlodipine', dosage: '5 mg', frequency: 'once daily', route: 'oral', startedAt: new Date('2018-01-30'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
      { patientId: PATIENT_ID, name: 'Omeprazole 20mg', genericName: 'omeprazole', dosage: '20 mg', frequency: 'once daily', route: 'oral', startedAt: new Date('2017-10-01'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
      { patientId: PATIENT_ID, name: 'Acetaminophen 500mg', genericName: 'acetaminophen', dosage: '500 mg', frequency: 'as needed', route: 'oral', startedAt: new Date('2020-04-01'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
      { patientId: PATIENT_ID, name: 'Vitamin D3 1000 IU', genericName: 'colecalciferol', dosage: '1000 IU', frequency: 'once daily', route: 'oral', startedAt: new Date('2016-03-10'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
      { patientId: PATIENT_ID, name: 'Levothyroxine 50mcg', genericName: 'levothyroxine', dosage: '50 mcg', frequency: 'once daily', route: 'oral', startedAt: new Date('2015-06-12'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
      { patientId: PATIENT_ID, name: 'Donepezil 10mg', genericName: 'donepezil', dosage: '10 mg', frequency: 'once nightly', route: 'oral', startedAt: new Date('2023-11-10'), status: 'ACTIVE', prescribedBy: 'Dr. Elena Chen' },
    ],
  });

  const amox = await prisma.medication.findFirstOrThrow({ where: { patientId: PATIENT_ID, genericName: 'amoxicillin' } });
  const sert = await prisma.medication.findFirstOrThrow({ where: { patientId: PATIENT_ID, genericName: 'sertraline' } });
  MED_AMOXICILLIN = amox.id;
  MED_SERTRALINE = sert.id;

  // Medication events — adherence history for baseline (90 days)
  const medEvents: Array<{ medicationId: string; medicationName: string; type: string; occurredAt: Date; sourceType: string }> = [];
  for (let i = 1; i <= 25; i++) {
    medEvents.push({ medicationId: MED_SERTRALINE, medicationName: 'Sertraline', type: 'TAKEN', occurredAt: daysAgo(88 - i * 3), sourceType: 'CAREGIVER' });
  }
  for (let i = 1; i <= 2; i++) {
    medEvents.push({ medicationId: MED_SERTRALINE, medicationName: 'Sertraline', type: 'MISSED', occurredAt: daysAgo(80 - i * 5), sourceType: 'CAREGIVER', reason: 'refused dose' } as never);
  }
  await prisma.medicationEvent.createMany({
    data: medEvents.map((e) => ({
      patientId: PATIENT_ID,
      medicationId: e.medicationId,
      medicationName: e.medicationName,
      type: e.type,
      occurredAt: e.occurredAt,
      sourceType: e.sourceType as never,
      reason: (e as { reason?: string }).reason ?? null,
    })) as never,
  });

  // Lab results
  await prisma.labResult.createMany({
    data: [
      { patientId: PATIENT_ID, testName: 'HbA1c', value: '7.8', unit: '%', referenceRange: '4.0 – 5.6', collectedAt: daysAgo(45), interpretation: 'Elevated', sourceId: 'LAB:Sunrise:8812' },
      { patientId: PATIENT_ID, testName: 'Creatinine', value: '1.3', unit: 'mg/dL', referenceRange: '0.7 – 1.2', collectedAt: daysAgo(45), interpretation: 'High-normal', sourceId: 'LAB:Sunrise:8813' },
      { patientId: PATIENT_ID, testName: 'Vitamin D (25-OH)', value: '18', unit: 'ng/mL', referenceRange: '30 – 100', collectedAt: daysAgo(60), interpretation: 'Deficient', sourceId: 'LAB:Sunrise:7904' },
      { patientId: PATIENT_ID, testName: 'Potassium', value: '3.4', unit: 'mmol/L', referenceRange: '3.5 – 5.0', collectedAt: daysAgo(45), interpretation: 'Low', sourceId: 'LAB:Sunrise:8814' },
      { patientId: PATIENT_ID, testName: 'Hemoglobin', value: '12.1', unit: 'g/dL', referenceRange: '13.5 – 17.5', collectedAt: daysAgo(45), interpretation: 'Low — mild anemia', sourceId: 'LAB:Sunrise:8815' },
    ],
  });

  // Encounters — wellness visits (no reconciliation, no post-discharge follow-up)
  const wellness: Array<{ year: number }> = [];
  for (let y = 2016; y <= 2026; y++) wellness.push({ year: y });
  await prisma.encounter.createMany({
    data: wellness.map((w) => ({
      patientId: PATIENT_ID,
      providerName: 'Dr. Elena Chen',
      type: 'wellness',
      reason: 'Annual wellness visit',
      startedAt: new Date(`${w.year}-03-${10 + (w.year % 10)}T14:00:00Z`),
      location: 'Sunrise Senior Care',
    })),
  });
  await prisma.encounter.createMany({
    data: [
      { patientId: PATIENT_ID, providerName: 'PT Clinic', type: 'physical-therapy', reason: 'Ankle sprain rehab', startedAt: new Date('2023-04-10T14:00:00Z'), endedAt: new Date('2023-06-20T14:00:00Z') },
      { patientId: PATIENT_ID, providerName: 'St. Marys Hospital', type: 'cardiology', reason: 'Post-hospitalization cardiology consult', startedAt: new Date('2025-03-20T10:00:00Z') },
    ],
  });

  // Assessments — cognitive + fall-risk are OLD (beyond the detection windows)
  await prisma.assessment.createMany({
    data: [
      { patientId: PATIENT_ID, type: 'cognitive', subtype: 'MMSE', score: 26, result: 'mild-impairment-suspected', notes: '26/30 — recommended specialist referral', assessedAt: daysAgo(240) },
      { patientId: PATIENT_ID, type: 'fall-risk', subtype: 'Morse', score: 45, result: 'moderate-risk', notes: 'Morse 45 — recommend home safety review', assessedAt: daysAgo(300) },
      { patientId: PATIENT_ID, type: 'mobility', subtype: 'TUG', score: 14, result: 'moderate-risk', notes: 'TUG 14s — above threshold', assessedAt: daysAgo(200) },
    ],
  });

  logger.log('  Clinical history seeded');
}

// ---------------------------------------------------------------------------
// PHASE 1c — Observations history (90 days, for BASELINE) + memory facts
// ---------------------------------------------------------------------------
async function phase1c() {
  logger.log('Phase 1c — 90-day observation history (baseline)');

  type HistSeed = { category: string; values: number[] };

  const history: HistSeed[] = [
    { category: 'CONFUSION', values: [2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 2, 3] },
    { category: 'APPETITE', values: [3, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3] },
    { category: 'MOBILITY', values: [3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2] },
    { category: 'SLEEP', values: [3, 3, 2, 3, 2, 3, 4, 3, 2, 3, 2, 3] },
    { category: 'MOOD', values: [2, 3, 2, 2, 3, 2, 2, 3, 2, 2, 3, 2] },
  ];

  const obsRows: Array<Record<string, unknown>> = [];
  for (const cat of history) {
    cat.values.forEach((score, idx) => {
      // spread across -88 .. -8 days
      const occurredAt = daysAgo(88 - idx * 6);
      const steps = cat.category === 'MOBILITY' ? 3800 + ((idx * 137) % 1000) : null;
      obsRows.push({
        patientId: PATIENT_ID,
        sourceUserId: MARIA_ID,
        sourceType: 'CAREGIVER',
        category: cat.category,
        rawText: `${cat.category.toLowerCase()} observation #${idx + 1}`,
        structured: { normalizedScore: score, score, severity: score >= 3 ? 'MILD' : 'NORMAL', ...(steps ? { steps } : {}) },
        severity: score >= 3 ? 'MILD' : null,
        occurredAt,
        verificationStatus: 'REPORTED',
      });
    });
  }

  await prisma.observation.createMany({ data: obsRows as never });

  // Memory facts — the "persistent health memory"
  await prisma.healthMemoryFact.createMany({
    data: [
      { patientId: PATIENT_ID, memoryType: 'FACT', category: 'weight', content: 'Usual body weight 73–75 kg (stable last 2 years)', provenance: { source: 'CAREGIVER', record: 'weight-log' } },
      { patientId: PATIENT_ID, memoryType: 'FACT', category: 'mobility', content: 'Typical walking 3,800–4,800 steps/day; uses cane outdoors', provenance: { source: 'CAREGIVER', record: 'steps-log' } },
      { patientId: PATIENT_ID, memoryType: 'FACT', category: 'sleep', content: 'Typical sleep 6–7h/night, one bathroom trip', provenance: { source: 'CAREGIVER', record: 'sleep-log' } },
      { patientId: PATIENT_ID, memoryType: 'OBSERVATION', category: 'cognitive', content: 'Occasionally repeats questions; otherwise orientated', provenance: { source: 'CAREGIVER', record: 'confusion-log' } },
      { patientId: PATIENT_ID, memoryType: 'FACT', category: 'medication', content: 'Amoxicillin anaphylaxis (2011) — carries allergy bracelet', provenance: { source: 'EHR:StMarys', record: 'allergy' } },
    ],
  });

  logger.log('  Baseline observation history + memory facts seeded');
}

// ---------------------------------------------------------------------------
// PHASE 1d — Historical episodes: 2023 (mild) and 2025 (the matching pattern)
// ---------------------------------------------------------------------------
async function phase1d() {
  logger.log('Phase 1d — historical episodes (2023, 2025)');

  // --- W1: March 2023 — fall + ankle sprain (mild) ---
  const ev1Fall = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'FALL', timestamp: new Date('2023-03-12T15:30:00Z'), sourceType: 'CAREGIVER', status: 'VERIFIED', confidence: 0.9, description: 'fell on driveway', metadata: { location: 'home' } },
  });
  const ev1Er = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'ER_VISIT', timestamp: new Date('2023-03-12T17:00:00Z'), sourceType: 'CAREGIVER', status: 'VERIFIED', confidence: 0.9, description: 'ER visit — ankle sprain', metadata: { facility: 'St. Marys ED' } },
  });
  const ev1Pain = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'SYMPTOM', timestamp: new Date('2023-03-13T09:00:00Z'), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: 'ankle pain', metadata: {} },
  });
  const ep1 = await prisma.episode.create({
    data: {
      patientId: PATIENT_ID,
      title: 'Fall — left ankle sprain (March 2023)',
      description: 'Slipped on wet driveway, ER visit, confirmed ankle sprain. Recovered with physical therapy.',
      startDate: new Date('2023-03-12T15:30:00Z'),
      endDate: new Date('2023-06-15T00:00:00Z'),
      outcome: 'Recovered after 12 weeks of physical therapy',
      severity: 'REVIEW',
      symptoms: ['left ankle pain'],
      functionalChanges: ['mobility'],
    },
  });
  await prisma.healthEvent.update({ where: { id: ev1Fall.id }, data: { episodeId: ep1.id } });
  await prisma.healthEvent.update({ where: { id: ev1Er.id }, data: { episodeId: ep1.id } });
  await prisma.healthEvent.update({ where: { id: ev1Pain.id }, data: { episodeId: ep1.id } });

  // --- W2: Feb–Mar 2025 — decline after Sertraline start: THE matching episode ---
  const ev2Med = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'MEDICATION_CHANGED', timestamp: new Date('2025-02-10T09:00:00Z'), sourceType: 'CLINICIAN', status: 'VERIFIED', confidence: 0.9, description: '', metadata: { medicationName: 'Sertraline', medication: 'Sertraline', action: 'STARTED' } },
  });
  const ev2Diz = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'SYMPTOM', timestamp: new Date('2025-02-18T10:30:00Z'), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: 'dizziness', metadata: { onsetDaysAfterMedChange: 8 } },
  });
  const ev2App = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'APPETITE_CHANGE', timestamp: new Date('2025-02-22T12:00:00Z'), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: 'poor appetite', metadata: {} },
  });
  const ev2Weak = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'SYMPTOM', timestamp: new Date('2025-02-25T09:00:00Z'), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: 'weakness', metadata: {} },
  });
  const ev2Fall = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'FALL', timestamp: new Date('2025-03-03T14:00:00Z'), sourceType: 'CAREGIVER', status: 'VERIFIED', confidence: 0.9, description: 'fell at home, hit head on table', metadata: {} },
  });
  const ev2Hosp = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'HOSPITALIZATION', timestamp: new Date('2025-03-03T17:30:00Z'), sourceType: 'CLINICIAN', status: 'VERIFIED', confidence: 1, description: 'hospitalized 4 days after fall', metadata: { facility: 'St. Marys Hospital' } },
  });

  const ep2 = await prisma.episode.create({
    data: {
      patientId: PATIENT_ID,
      title: 'Decline after Sertraline start (Feb–Mar 2025)',
      description: 'Days after Sertraline was added: dizziness → poor appetite → weakness → fall with head strike → 4-day hospitalization. Recovered after dose reduction and rehab.',
      startDate: new Date('2025-02-10T09:00:00Z'),
      endDate: new Date('2025-03-28T00:00:00Z'),
      outcome: 'Hospitalized 4 days; recovered after Sertraline dose reduction + rehab',
      severity: 'CRITICAL',
      symptoms: ['dizziness', 'poor appetite', 'weakness'],
      medicationsInvolved: ['Sertraline'],
      functionalChanges: ['mobility'],
      cognitiveChanges: [],
    },
  });
  for (const id of [ev2Med.id, ev2Diz.id, ev2App.id, ev2Weak.id, ev2Fall.id, ev2Hosp.id]) {
    await prisma.healthEvent.update({ where: { id }, data: { episodeId: ep2.id } });
  }

  // --- May 2026: recent hospitalization (no follow-up → gap detection) ---
  await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'HOSPITALIZATION', timestamp: new Date('2026-05-12T11:00:00Z'), sourceType: 'CLINICIAN', status: 'VERIFIED', confidence: 1, description: 'hospitalized 3 days — dehydration', metadata: { facility: 'St. Marys Hospital' } },
  });

  logger.log('  Historical episodes seeded (2023, 2025, May-2026 hospitalization)');
}

// ---------------------------------------------------------------------------
// PHASE 2 — Compute the personal BASELINE (from 90d of clean history)
// ---------------------------------------------------------------------------
async function phase2() {
  logger.log('Phase 2 — computing personal baseline (real engine)');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const baselines = app.get(BaselinesService);
  const result = await baselines.getOrCompute(PATIENT_ID);
  logger.log(`  Baseline computed: status=${result.data.status}`);
  for (const m of result.data.metrics ?? []) {
    logger.log(`    - ${m.metric}: value=${m.value} n=${m.sampleSize} confidence=${m.confidence}`);
  }
  await app.close();
}

// ---------------------------------------------------------------------------
// PHASE 3 — Seed the CURRENT window (last 7 days): deterioration after 2 new meds
// ---------------------------------------------------------------------------
async function phase3() {
  logger.log('Phase 3 — seeding current window (last 7 days)');

  // Sertraline started event (within 14 days → episode matching window).
  // Amoxicillin is deliberately NOT given a paired MEDICATION_CHANGED event so
  // the episode signature stays focused on the Sertraline decline narrative.
  const evSert = await prisma.healthEvent.create({
    data: { patientId: PATIENT_ID, type: 'MEDICATION_CHANGED', timestamp: daysAgo(8), sourceType: 'CLINICIAN', status: 'VERIFIED', confidence: 0.95, description: '', metadata: { medicationName: 'Sertraline', medication: 'Sertraline', action: 'STARTED' } },
  });
  EVENT_SERT_START = evSert.id;

  // 40 days ago: second near-fall → triggers the fall-risk assessment gap rule
  await prisma.healthEvent.create({ data: { patientId: PATIENT_ID, type: 'NEAR_FALL', timestamp: daysAgo(40), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: '', metadata: {} } });

  // Caregiver-report narrative events (descriptions mirror the 2025 episode
  // vocabulary so signature overlap/historical matching is meaningful)
  await prisma.healthEvent.create({ data: { patientId: PATIENT_ID, type: 'SYMPTOM', timestamp: daysAgo(6), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: 'dizziness', metadata: {} } });
  await prisma.healthEvent.create({ data: { patientId: PATIENT_ID, type: 'APPETITE_CHANGE', timestamp: daysAgo(5), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: 'poor appetite', metadata: {} } });
  await prisma.healthEvent.create({ data: { patientId: PATIENT_ID, type: 'SYMPTOM', timestamp: daysAgo(4), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: 'weakness', metadata: {} } });
  await prisma.healthEvent.create({ data: { patientId: PATIENT_ID, type: 'NEAR_FALL', timestamp: daysAgo(3), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.85, description: '', metadata: {} } });
  await prisma.healthEvent.create({ data: { patientId: PATIENT_ID, type: 'COGNITIVE_CHANGE', timestamp: daysAgo(2), sourceType: 'CAREGIVER', status: 'REPORTED', confidence: 0.8, description: '', metadata: {} } });

  // Current-window observations — deterioration scores (no paired events: kept minimal)
  type CurSeed = { category: string; value: number; stept?: number };
  const current: CurSeed[] = [
    { category: 'CONFUSION', value: 7 },
    { category: 'CONFUSION', value: 7 },
    { category: 'CONFUSION', value: 7 },
    { category: 'APPETITE', value: 6.5 },
    { category: 'APPETITE', value: 6.5 },
    { category: 'APPETITE', value: 6.5 },
    { category: 'MOBILITY', value: 6.5, stept: 2200 },
    { category: 'MOBILITY', value: 6.5, stept: 1800 },
    { category: 'MOBILITY', value: 6.5, stept: 2100 },
    { category: 'SLEEP', value: 6.7 },
    { category: 'SLEEP', value: 6.7 },
    { category: 'SLEEP', value: 6.7 },
    { category: 'MOOD', value: 6.3 },
    { category: 'MOOD', value: 6.3 },
    { category: 'MOOD', value: 6.3 },
  ];

  const rows: Array<Record<string, unknown>> = [];
  current.forEach((c, idx) => {
    rows.push({
      patientId: PATIENT_ID,
      sourceUserId: MARIA_ID,
      sourceType: 'CAREGIVER',
      category: c.category,
      rawText: `Recent ${c.category.toLowerCase()} observation #${idx + 1}`,
      structured: { normalizedScore: c.value, score: c.value, severity: 'MODERATE', ...(c.stept ? { steps: c.stept } : {}) },
      severity: 'MODERATE',
      occurredAt: daysAgo(6 - (idx % 6)),
      verificationStatus: 'REPORTED',
    });
  });
  await prisma.observation.createMany({ data: rows as never });

  // Notifications for the care team + guardians
  await prisma.notification.createMany({
    data: [
      { userId: SARAH_ID, patientId: PATIENT_ID, type: 'RISK_SIGNAL', title: 'Robert — new risk signal', body: 'Multi-domain change detected vs personal baseline. Review the clinical brief.', metadata: { } },
      { userId: DRCHEN_ID, patientId: PATIENT_ID, type: 'MEDICATION_CONFLICT', title: 'Robert — medication allergy conflict', body: 'Amoxicillin active despite documented anaphylaxis. Review urgently.', metadata: {} },
      { userId: DRPARK_ID, patientId: PATIENT_ID, type: 'GAP', title: 'Robert — missing assessments', body: 'Fall-risk & cognitive reassessment recommended.', metadata: {} },
    ],
  });

  // Documents — May 2026 discharge summary (supports document/evidence views)
  await prisma.document.create({
    data: {
      patientId: PATIENT_ID,
      filename: 'discharge-summary-2026-05.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 58210,
      storageKey: 'patients/demo/robert-miller/discharge-summary-2026-05.pdf',
      documentType: 'DISCHARGE_SUMMARY',
      uploadedBy: DRCHEN_ID,
      status: 'PROCESSED',
      parsedText: 'Admission: dehydration, acute on chronic. Patient is a 82yo male, known anaphylactic allergy to amoxicillin and penicillin (2011). Discharged 2026-05-15 with instructions for hydration, dietary sodium restriction. Plan: primary care follow-up within 2 weeks.',
      metadata: { facility: 'St. Marys Hospital', encounter: '2026-05' },
    },
  });

  logger.log('  Current window seeded (2 new meds + caregiver reports)');
}

// ---------------------------------------------------------------------------
// PHASE 4 — Run the REAL analysis engines
// ---------------------------------------------------------------------------
async function phase4() {
  logger.log('Phase 4 — running real analysis engines');
  step('p4-context');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });

  try {
    step('p4-change-detect');
    const change = app.get(ChangeDetectionService);
    const res = await change.detect(PATIENT_ID);
    if (res.data) {
      const sig = res.data as unknown as { summary: string; severity: string; signalType: string; metrics: Array<{ metric: string; baseline: number; current: number; deviationPercent: number }> };
      logger.log(`  Change detection → ${sig.signalType} / ${sig.severity}`);
      for (const m of sig.metrics ?? []) {
        logger.log(`    - ${m.metric}: baseline=${m.baseline} current=${m.current} (${m.deviationPercent}%)`);
      }
    } else {
      logger.log(`  Change detection → ${res.message}`);
    }
  } catch (e) {
    logger.warn(`  Change detection failed (non-fatal): ${(e as Error).message}`);
  }

  try {
    step('p4-episodes');
    const episodes = app.get(EpisodesService);
    const matches = await episodes.matchCurrent(PATIENT_ID);
    logger.log(`  Episode matching → ${(matches.data ?? []).length} historical match(es)`);
    for (const m of matches.data ?? []) {
      logger.log(`    - ${m.matchedEpisodeTitle} | similarity=${m.similarityScore} confidence=${m.confidence}`);
    }
  } catch (e) {
    logger.warn(`  Episode matching failed (non-fatal): ${(e as Error).message}`);
  }

  try {
    step('p4-contradictions');
    const contradictions = app.get(ContradictionsService);
    const res = await contradictions.detect(PATIENT_ID);
    for (const c of res.data ?? []) {
      logger.log(`  Contradiction → [${c.type}] ${c.description} (${c.confidence})`);
    }
  } catch (e) {
    logger.warn(`  Contradiction detection failed (non-fatal): ${(e as Error).message}`);
  }

  try {
    step('p4-missing');
    const missing = app.get(MissingInfoService);
    const res = await missing.detect(PATIENT_ID);
    for (const m of res.data ?? []) {
      logger.log(`  Missing info → [${m.category}] ${m.description} (${m.severity})`);
    }
  } catch (e) {
    logger.warn(`  Missing info detection failed (non-fatal): ${(e as Error).message}`);
  }

  try {
    step('p4-ai');
    const ai = app.get(AiService);
    const run = await ai.runAnalysis(PATIENT_ID, ADMIN_ID, EVENT_SERT_START);
    const agentRunId = run.agentRun.id as string;
    const persisted = await prisma.agentRun.findUnique({ where: { id: agentRunId } });
    logger.log(`  AI analysis → agent run #${agentRunId} status=${persisted?.status} riskSignal=${run.riskSignal?.id ?? 'none'}`);
  } catch (e) {
    logger.warn(`  AI analysis failed (non-fatal — mock provider): ${(e as Error).message}`);
  }

  try {
    step('p4-brief');
    const brief = app.get(BriefService);
    const b = await brief.build(PATIENT_ID);
    logger.log(`  Clinical brief → ${(b as unknown as { summary?: string }).summary ?? 'generated'}`);
  } catch (e) {
    logger.warn(`  Brief build failed (non-fatal): ${(e as Error).message}`);
  }

  await app.close();
  step('p4-done');
}

// ---------------------------------------------------------------------------
// Cleanup — make the seed idempotent for re-runs
// ---------------------------------------------------------------------------
async function cleanup() {
  const P = PATIENT_ID;
  const patientScope = { where: { patientId: P } };

  // Children of Consent cascade-managed, but delete explicitly in dependency order
  await prisma.permission.deleteMany({ where: { consent: { patientId: P } } });
  await prisma.consent.deleteMany(patientScope);
  await prisma.guardianRelationship.deleteMany(patientScope);
  await prisma.patientOrganizationRelationship.deleteMany(patientScope);
  await prisma.patientUserRelationship.deleteMany(patientScope);
  await prisma.notification.deleteMany(patientScope);
  await prisma.document.deleteMany(patientScope);
  await prisma.assessment.deleteMany(patientScope);
  await prisma.encounter.deleteMany(patientScope);
  await prisma.labResult.deleteMany(patientScope);
  await prisma.observation.deleteMany(patientScope);
  await prisma.medicationEvent.deleteMany(patientScope);
  await prisma.medication.deleteMany(patientScope);
  await prisma.healthEvent.deleteMany(patientScope);
  await prisma.episode.deleteMany(patientScope);
  await prisma.allergy.deleteMany(patientScope);
  await prisma.condition.deleteMany(patientScope);
  await prisma.healthMemoryFact.deleteMany(patientScope);
  await prisma.missingInformation.deleteMany(patientScope);
  await prisma.contradiction.deleteMany(patientScope);
  await prisma.emergencyAccess.deleteMany(patientScope);
  await prisma.agentRun.deleteMany(patientScope);
  await prisma.riskSignal.deleteMany(patientScope); // cascades Evidence + ClinicianFeedback
  await prisma.baseline.deleteMany(patientScope);
  await prisma.patient.deleteMany({ where: { id: P } });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  logger.log('=== BASELINE seed starting ===');

  // Resolve patient id before cleanup (fixed demo id)
  PATIENT_ID = '00000000-0000-4000-8000-0000000000ab';

  await cleanup();
  await phase1();
  await phase1b();
  await phase1c();
  await phase1d();
  await phase2(); // baseline computed BEFORE current-window deterioration
  await phase3();
  await phase4();

  logger.log('=== BASELINE seed complete ===');
  logger.log('Demo accounts (all password: demo1234)');
  logger.log('  Patient:          robert.patient@baseline.demo');
  logger.log('  Daughter/caregiver sarah.daughter@baseline.demo');
  logger.log('  Caregiver:        maria.pelletier@baseline.demo');
  logger.log('  Clinician:        drchen@baseline.demo');
  logger.log('  Pharmacist:       pharm.patel@baseline.demo');
  logger.log('  Emergency:        drpark@baseline.demo');
  logger.log('  Admin:            admin@baseline.demo');
}

main()
  .catch(async (e) => {
    logger.error(`Seed failed: ${e.message}`);
    logger.error(e.stack ?? '');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });