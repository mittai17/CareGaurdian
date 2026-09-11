import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding medications and observations for all patients...');
  
  const patients = await prisma.patient.findMany();
  console.log(`Found ${patients.length} patients.`);

  for (const patient of patients) {
    // Check if patient already has medications
    const medCount = await prisma.medication.count({ where: { patientId: patient.id } });
    if (medCount === 0) {
      console.log(`Adding medications for ${patient.firstName} ${patient.lastName}`);
      await prisma.medication.createMany({
        data: [
          {
            patientId: patient.id,
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            route: 'Oral',
            status: 'ACTIVE',
            startedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          },
          {
            patientId: patient.id,
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            route: 'Oral',
            status: 'ACTIVE',
            startedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
          }
        ]
      });
    }

    // Check if patient already has observations
    const obsCount = await prisma.observation.count({ where: { patientId: patient.id } });
    if (obsCount === 0) {
      console.log(`Adding observations for ${patient.firstName} ${patient.lastName}`);
      await prisma.observation.createMany({
        data: [
          {
            patientId: patient.id,
            sourceType: 'CAREGIVER',
            category: 'MOOD',
            rawText: 'Patient seemed a bit down today, didn\'t eat much lunch.',
            structured: { mood: 'Fair', appetite: 'Poor' },
            severity: 'ATTENTION',
            occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            verificationStatus: 'REPORTED'
          },
          {
            patientId: patient.id,
            sourceType: 'PATIENT',
            category: 'SLEEP',
            rawText: 'Woke up multiple times during the night with back pain.',
            structured: { sleepQuality: 'Poor', awakenings: 3 },
            severity: 'REVIEW',
            occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            verificationStatus: 'REPORTED'
          },
          {
            patientId: patient.id,
            sourceType: 'CLINICIAN',
            category: 'MOBILITY',
            rawText: 'Slight unsteadiness observed when getting up from chair.',
            structured: { mobility: 'Impaired', risk: 'Fall risk' },
            severity: 'REVIEW',
            occurredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            verificationStatus: 'DOCUMENTED'
          }
        ]
      });
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
