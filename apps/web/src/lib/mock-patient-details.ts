export const MOCK_MEDICATIONS = [
  { id: '1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', status: 'ACTIVE', startedAt: '2022-01-15T00:00:00Z', prescribedBy: 'Dr. Vikram Malhotra', signals: ['ADHERENCE_DECLINE'] },
  { id: '2', name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', status: 'ACTIVE', startedAt: '2023-05-10T00:00:00Z', prescribedBy: 'Dr. Elena Chen', signals: [] },
  { id: '3', name: 'Amoxicillin', dosage: '250mg', frequency: 'Three times daily', status: 'ACTIVE', startedAt: '2026-09-01T00:00:00Z', prescribedBy: 'Dr. Vikram Malhotra', signals: ['POTENTIAL_ALLERGY_CONFLICT'] },
  { id: '4', name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime', status: 'ACTIVE', startedAt: '2024-02-20T00:00:00Z', prescribedBy: 'Dr. Elena Chen', signals: ['RECENT_CHANGE'], recentChange: { date: '2026-08-15T00:00:00Z', description: 'Dose increased from 10mg to 20mg' } },
];

export const MOCK_LABS = [
  { id: 'l1', name: 'HbA1c', value: '7.2', unit: '%', range: '4.0 - 5.6', status: 'HIGH', date: '2026-08-15' },
  { id: 'l2', name: 'Serum Creatinine', value: '1.1', unit: 'mg/dL', range: '0.6 - 1.2', status: 'NORMAL', date: '2026-08-15' },
  { id: 'l3', name: 'LDL Cholesterol', value: '115', unit: 'mg/dL', range: '< 100', status: 'HIGH', date: '2026-08-15' },
  { id: 'l4', name: 'Potassium', value: '4.2', unit: 'mmol/L', range: '3.5 - 5.0', status: 'NORMAL', date: '2026-08-15' },
];

export const MOCK_NOTES = [
  { id: 'n1', author: 'Dr. Elena Chen', role: 'Primary Care', date: '2026-09-02', content: 'Patient reports mild dizziness when standing up quickly. Blood pressure normal during visit. Advised to stay hydrated and get up slowly.' },
  { id: 'n2', author: 'Karthik Sundaram', role: 'Family Caregiver', date: '2026-08-28', content: 'Mom has been forgetting to take her evening medicines. We need to set a louder alarm.' },
  { id: 'n3', author: 'Dr. Vikram Malhotra', role: 'Cardiologist', date: '2026-07-15', content: 'Routine cardiac checkup. ECG shows normal sinus rhythm. Continue current medications.' },
];

export const MOCK_OBSERVATIONS = [
  { id: 'o1', reporter: 'Karthik Sundaram', relationship: 'Son', avatar: 'K', text: 'Mom seems a bit confused in the evenings, asking what day it is.', date: '2026-09-08T18:30:00Z', category: 'CONFUSION', status: 'REPORTED' },
  { id: 'o2', reporter: 'Meera (Home Care)', relationship: 'Nurse', avatar: 'M', text: 'Patient ate less than half her meals today. Complains of no appetite.', date: '2026-09-05T14:15:00Z', category: 'APPETITE', status: 'MEASURED' },
  { id: 'o3', reporter: 'Devaki (Self)', relationship: 'Patient', avatar: 'D', text: 'I feel dizzy when I try to get out of bed quickly.', date: '2026-09-02T08:00:00Z', category: 'MOBILITY', status: 'REPORTED' },
  { id: 'o4', reporter: 'Dr. Elena Chen', relationship: 'Primary Doctor', avatar: 'E', text: 'Noted orthostatic hypotension during clinic visit. Blood pressure drops upon standing.', date: '2026-09-02T10:45:00Z', category: 'CLINICAL_NOTE', status: 'CLINICALLY_VERIFIED' }
];

export const MOCK_DOCUMENTS = [
  { id: 'd1', title: 'Cardiology Report (July 2026).pdf', type: 'Clinical Report', date: '2026-07-15T00:00:00Z', size: '1.2 MB', uploader: 'Dr. Vikram Malhotra', tags: ['Cardiology', 'Routine'] },
  { id: 'd2', title: 'Discharge Summary - City Hospital.pdf', type: 'Discharge Summary', date: '2025-11-20T00:00:00Z', size: '3.4 MB', uploader: 'System', tags: ['Hospitalization', 'Surgery'] },
  { id: 'd3', title: 'Caregiver Weekly Assessment - Week 34.pdf', type: 'Caregiver Report', date: '2026-08-30T00:00:00Z', size: '0.5 MB', uploader: 'Meera (Home Care)', tags: ['Assessment', 'Weekly'] },
];

export const MOCK_EPISODES = [
  { id: 'e1', title: 'Mild Cognitive Decline', status: 'ACTIVE', startDate: '2026-08-01T00:00:00Z', severity: 'MODERATE', summary: 'Recent observations point to mild confusion in the evenings and occasional missed medications.' },
  { id: 'e2', title: 'Orthostatic Hypotension', status: 'ACTIVE', startDate: '2026-09-02T00:00:00Z', severity: 'MILD', summary: 'Patient reports dizziness upon standing; verified in clinic.' },
  { id: 'e3', title: 'Hip Replacement Surgery', status: 'RESOLVED', startDate: '2025-11-15T00:00:00Z', endDate: '2026-02-10T00:00:00Z', severity: 'SEVERE', summary: 'Successful right hip replacement. Post-op physical therapy completed.' }
];

export const MOCK_CARE_CIRCLE = [
  { id: 'c1', name: 'Dr. Elena Chen', role: 'Primary Doctor', relation: 'Clinical', phone: '+1 555-0100', email: 'e.chen@clinic.com', status: 'ACTIVE' },
  { id: 'c2', name: 'Dr. Vikram Malhotra', role: 'Cardiologist', relation: 'Specialist', phone: '+1 555-0102', email: 'v.malhotra@heart.com', status: 'ACTIVE' },
  { id: 'c3', name: 'Karthik Sundaram', role: 'Primary Caregiver', relation: 'Son', phone: '+1 555-0201', email: 'karthik@example.com', status: 'ACTIVE' },
  { id: 'c4', name: 'Priya Sundaram', role: 'Secondary Caregiver', relation: 'Daughter', phone: '+1 555-0202', email: 'priya@example.com', status: 'ACTIVE' },
  { id: 'c5', name: 'Meera', role: 'Home Nurse', relation: 'Professional', phone: '+1 555-0303', email: 'meera@homecare.com', status: 'ACTIVE' },
];

export const MOCK_CONTRADICTIONS = [
  { id: 'ct1', type: 'Medication Adherence', description: 'Patient reports taking all medications, but caregiver notes missing evening doses twice this week.', severity: 'MODERATE', date: '2026-09-08T00:00:00Z' },
  { id: 'ct2', type: 'Allergy Record', description: 'Amoxicillin prescribed, but 2025 record indicates Penicillin allergy.', severity: 'CRITICAL', date: '2026-09-01T00:00:00Z' }
];

export const MOCK_GAPS = [
  { id: 'g1', category: 'Clinical Data', description: 'Missing recent renal function panel (BUN/Creatinine) required for current Lisinopril dosage.', severity: 'MODERATE', date: '2026-09-10T00:00:00Z' },
  { id: 'g2', category: 'Caregiver Input', description: 'No physical therapy update logged in the past 6 months following hip replacement.', severity: 'LOW', date: '2026-08-15T00:00:00Z' }
];

export const MOCK_ENCOUNTERS = [
  { id: 'enc1', type: 'EMERGENCY', reason: 'Syncope / Fall', providerName: 'Dr. Rahul Mehta', location: 'City Hospital ER', startedAt: '2026-09-02T10:00:00Z', endedAt: '2026-09-02T16:00:00Z', status: 'DISCHARGED', dischargeSummary: 'Patient presented with dizziness and near-fall. Orthostatic vitals positive. Fluids administered.' },
  { id: 'enc2', type: 'OUTPATIENT', reason: 'Routine Cardiology Follow-up', providerName: 'Dr. Vikram Malhotra', location: 'Heart Center', startedAt: '2026-07-15T09:00:00Z', endedAt: '2026-07-15T09:45:00Z', status: 'COMPLETED', dischargeSummary: 'ECG normal. Continue Atorvastatin.' },
  { id: 'enc3', type: 'TELEHEALTH', reason: 'Medication Review', providerName: 'Dr. Elena Chen', location: 'Teleclinic', startedAt: '2026-05-10T14:00:00Z', endedAt: '2026-05-10T14:30:00Z', status: 'COMPLETED', dischargeSummary: 'Discussed Lisinopril adherence. Patient reports no side effects.' }
];
export const MOCK_TIMELINE = {
  currentYear: 2026,
  years: [
    {
      year: 2026,
      status: 'CONCERN',
      label: 'Concern',
      summary: 'Deterioration in medication adherence and new orthostatic hypotension episodes.',
      reasons: ['Missed medications', 'Near falls', 'Appetite loss'],
      events: [
        { id: 't26_1', type: 'EPISODE', date: '2026-09-02T10:00:00Z', title: 'ER Visit - Syncope', description: 'Patient fell due to orthostatic hypotension.', severity: 'High' },
        { id: 't26_2', type: 'OBSERVATION', date: '2026-08-15T00:00:00Z', title: 'Medication Adherence Drop', description: 'Caregiver reports missed evening doses.', severity: 'Moderate' },
        { id: 't26_3', type: 'MEDICATION_CHANGE', date: '2026-02-20T00:00:00Z', title: 'Atorvastatin Adjusted', description: 'Dose increased to 20mg.', severity: 'Low' },
      ],
      metrics: { adherence: 72, mobility: 40, cognition: 60 }
    },
    {
      year: 2025,
      status: 'CRITICAL',
      label: 'Critical',
      summary: 'Major surgery: Right Hip Replacement with prolonged recovery.',
      reasons: ['Hip Fracture', 'Hospitalization', 'Infection Risk'],
      events: [
        { id: 't25_1', type: 'EPISODE', date: '2025-11-15T00:00:00Z', title: 'Hip Replacement Surgery', description: 'Right hip replacement after fall.', severity: 'High' },
        { id: 't25_2', type: 'DOCUMENT', date: '2025-11-20T00:00:00Z', title: 'Discharge Summary', description: 'Discharged to home care with PT orders.', severity: 'Low' },
      ],
      metrics: { adherence: 85, mobility: 20, cognition: 85 }
    },
    {
      year: 2024,
      status: 'WATCH',
      label: 'Watch',
      summary: 'Early signs of hypertension noted, manageable with lifestyle and Lisinopril.',
      reasons: ['Elevated BP'],
      events: [
        { id: 't24_1', type: 'CLINICAL', date: '2024-05-10T00:00:00Z', title: 'Hypertension Diagnosed', description: 'Lisinopril 10mg started.', severity: 'Moderate' }
      ],
      metrics: { adherence: 98, mobility: 80, cognition: 95 }
    },
    {
      year: 2023,
      status: 'STABLE',
      label: 'Stable',
      summary: 'Patient was stable with no major clinical events.',
      reasons: ['Routine Checkup'],
      events: [
        { id: 't23_1', type: 'CLINICAL', date: '2023-01-10T00:00:00Z', title: 'Annual Checkup', description: 'All vitals normal.', severity: 'Low' }
      ],
      metrics: { adherence: 100, mobility: 85, cognition: 98 }
    },
    {
      year: 2022,
      status: 'STABLE',
      label: 'Stable',
      summary: 'Metformin started for mild glucose elevation.',
      reasons: ['Pre-diabetes'],
      events: [
        { id: 't22_1', type: 'MEDICATION_CHANGE', date: '2022-01-15T00:00:00Z', title: 'Metformin Started', description: '500mg Twice daily prescribed.', severity: 'Low' }
      ],
      metrics: { adherence: 100, mobility: 90, cognition: 100 }
    }
  ]
};
