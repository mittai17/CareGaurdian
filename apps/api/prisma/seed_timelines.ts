import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HISTORICAL_EVENTS = [
  // 12d12b80-9848-4130-89ba-10f6334c6899 (Janaki - Critical)
  { patientId: '12d12b80-9848-4130-89ba-10f6334c6899', type: 'HOSPITALIZATION', timestamp: '2025-06-15T10:00:00Z', sourceType: 'CLINICIAN', description: 'Admitted for congestive heart failure exacerbation', status: 'REPORTED', confidence: 0.95 },
  { patientId: '12d12b80-9848-4130-89ba-10f6334c6899', type: 'ER_VISIT', timestamp: '2025-02-10T10:00:00Z', sourceType: 'CLINICIAN', description: 'ER visit for severe shortness of breath', status: 'REPORTED', confidence: 0.9 },
  { patientId: '12d12b80-9848-4130-89ba-10f6334c6899', type: 'FALL', timestamp: '2024-11-20T10:00:00Z', sourceType: 'CAREGIVER', description: 'Fall at home, minor bruising', status: 'REPORTED', confidence: 0.8 },
  { patientId: '12d12b80-9848-4130-89ba-10f6334c6899', type: 'HOSPITALIZATION', timestamp: '2026-08-01T10:00:00Z', sourceType: 'CLINICIAN', description: 'ICU admission for acute decompensated heart failure', status: 'REPORTED', confidence: 0.99 },
  { patientId: '12d12b80-9848-4130-89ba-10f6334c6899', type: 'MEDICATION_CHANGED', timestamp: '2026-08-10T10:00:00Z', sourceType: 'CLINICIAN', description: 'Started on Milrinone continuous infusion', status: 'REPORTED', confidence: 0.95 },
  
  // 66c67bf7-f6e3-478e-b972-20d7d25b4958 (Ravi - Critical)
  { patientId: '66c67bf7-f6e3-478e-b972-20d7d25b4958', type: 'HOSPITALIZATION', timestamp: '2025-08-12T10:00:00Z', sourceType: 'CLINICIAN', description: 'Post-surgical complications', status: 'REPORTED', confidence: 0.9 },
  { patientId: '66c67bf7-f6e3-478e-b972-20d7d25b4958', type: 'COGNITIVE_CHANGE', timestamp: '2024-05-15T10:00:00Z', sourceType: 'CAREGIVER', description: 'Post-operative delirium', status: 'REPORTED', confidence: 0.85 },
  { patientId: '66c67bf7-f6e3-478e-b972-20d7d25b4958', type: 'HOSPITALIZATION', timestamp: '2026-07-20T10:00:00Z', sourceType: 'CLINICIAN', description: 'Readmission for surgical site infection', status: 'REPORTED', confidence: 0.95 },

  // 3489a162-e878-493a-92e3-ad33476afc55 (Mohan - Critical)
  { patientId: '3489a162-e878-493a-92e3-ad33476afc55', type: 'ER_VISIT', timestamp: '2025-04-10T10:00:00Z', sourceType: 'CLINICIAN', description: 'ER visit for rapid atrial fibrillation', status: 'REPORTED', confidence: 0.95 },
  { patientId: '3489a162-e878-493a-92e3-ad33476afc55', type: 'HOSPITALIZATION', timestamp: '2024-09-22T10:00:00Z', sourceType: 'CLINICIAN', description: 'Admitted for acute kidney injury on CKD', status: 'REPORTED', confidence: 0.9 },
  { patientId: '3489a162-e878-493a-92e3-ad33476afc55', type: 'FALL', timestamp: '2026-08-15T10:00:00Z', sourceType: 'CAREGIVER', description: 'Fall resulting in hip fracture', status: 'REPORTED', confidence: 0.95 },
  { patientId: '3489a162-e878-493a-92e3-ad33476afc55', type: 'HOSPITALIZATION', timestamp: '2026-08-15T12:00:00Z', sourceType: 'CLINICIAN', description: 'Admitted for hip replacement surgery', status: 'REPORTED', confidence: 0.99 },

  // e442022e-1232-4ccb-b5bc-c6b3bbcc67cb (Shanmugam - Critical)
  { patientId: 'e442022e-1232-4ccb-b5bc-c6b3bbcc67cb', type: 'HOSPITALIZATION', timestamp: '2025-11-05T10:00:00Z', sourceType: 'CLINICIAN', description: 'Severe COPD exacerbation requiring BiPAP', status: 'REPORTED', confidence: 0.95 },
  { patientId: 'e442022e-1232-4ccb-b5bc-c6b3bbcc67cb', type: 'ER_VISIT', timestamp: '2024-03-12T10:00:00Z', sourceType: 'CLINICIAN', description: 'Hypertensive crisis', status: 'REPORTED', confidence: 0.9 },
  { patientId: 'e442022e-1232-4ccb-b5bc-c6b3bbcc67cb', type: 'HOSPITALIZATION', timestamp: '2026-06-10T10:00:00Z', sourceType: 'CLINICIAN', description: 'Admitted for pneumonia with COPD stage III', status: 'REPORTED', confidence: 0.95 },

  // 77777777-0000-4000-8000-000000000001 (Devaki - High)
  { patientId: '77777777-0000-4000-8000-000000000001', type: 'ER_VISIT', timestamp: '2025-07-20T10:00:00Z', sourceType: 'CLINICIAN', description: 'ER visit for hypertensive emergency', status: 'REPORTED', confidence: 0.9 },
  { patientId: '77777777-0000-4000-8000-000000000001', type: 'FALL', timestamp: '2024-12-05T10:00:00Z', sourceType: 'CAREGIVER', description: 'Slipped in bathroom, no fractures', status: 'REPORTED', confidence: 0.8 },
  { patientId: '77777777-0000-4000-8000-000000000001', type: 'HOSPITALIZATION', timestamp: '2026-05-15T10:00:00Z', sourceType: 'CLINICIAN', description: 'Admitted for poorly controlled HFpEF', status: 'REPORTED', confidence: 0.95 },
];

async function main() {
  console.log("Seeding historical timelines...");
  let count = 0;
  for (const ev of HISTORICAL_EVENTS) {
    await prisma.healthEvent.create({
      data: {
        patientId: ev.patientId,
        type: ev.type as any,
        timestamp: new Date(ev.timestamp),
        sourceType: ev.sourceType as any,
        description: ev.description,
        status: ev.status as any,
        confidence: ev.confidence,
        metadata: {}
      }
    });
    count++;
  }
  console.log(`Added ${count} historical events.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
