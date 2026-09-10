import json
import random
from datetime import datetime, timedelta

# Doctor details
DOCTORS = [
  {'email':'dr.arjun.nair@careguardian.health', 'name':'Dr. Arjun Nair', 'org':'Sunrise Senior Care Centre'},
  {'email':'dr.priya.sharma@careguardian.health', 'name':'Dr. Priya Sharma', 'org':'Sunrise Senior Care Centre'},
  {'email':'dr.meera.pillai@careguardian.health', 'name':'Dr. Meera Pillai', 'org':'CareFirst Neurology Clinic'},
  {'email':'dr.rajan.menon@careguardian.health', 'name':'Dr. Rajan Menon', 'org':'HeartCare Hospital'},
  {'email':'dr.lakshmi.iyer@careguardian.health', 'name':'Dr. Lakshmi Iyer', 'org':'Sunrise Senior Care Centre'},
]

PATIENTS = [
  { 'docIdx':0, 'fn':'Ravi', 'ln':'Kumar', 'dob':'1950-03-15', 'gender':'Male', 'phone':'+91-98765-43210', 'addr':'HSR Layout, Bangalore, Karnataka', 'email':'ravi.kumar@careguardian.health', 'ec':{'n':'Ananya Kumar','p':'+91-98765-00001'},
    'conds':[{'name':'Type 2 Diabetes Mellitus','code':'E11.9'},{'name':'Hypertension','code':'I10'},{'name':'Hyperlipidaemia','code':'E78.5'}],
    'allergies':[{'sub':'Penicillin','rx':'Rash','sev':'MODERATE'}],
    'meds':[{'name':'Metformin 1000mg'},{'name':'Amlodipine 5mg'},{'name':'Atorvastatin 20mg'}],
    'base_health': 'declining_metabolic'
  },
  { 'docIdx':0, 'fn':'Sunita', 'ln':'Balasubramanian', 'dob':'1948-11-22', 'gender':'Female', 'phone':'+91-96300-78901', 'addr':'Koramangala, Bangalore', 'email':'sunita.balasubramanian@careguardian.health', 'ec':{'n':'Karthik Balasubramanian','p':'+91-96300-00002'},
    'conds':[{'name':'Osteoporosis','code':'M81.0'},{'name':'Rheumatoid Arthritis','code':'M06.9'}],
    'allergies':[{'sub':'Sulfonamides','rx':'Hives','sev':'MODERATE'}],
    'meds':[{'name':'Alendronate 70mg'},{'name':'Methotrexate 10mg'}],
    'base_health': 'stable_mobility'
  },
  { 'docIdx':0, 'fn':'Gopalan', 'ln':'Rajan', 'dob':'1943-07-08', 'gender':'Male', 'phone':'+91-94440-11223', 'addr':'Malleswaram, Bangalore', 'email':'gopalan.rajan@careguardian.health', 'ec':{'n':'Kavitha Rajan','p':'+91-94440-00003'},
    'conds':[{'name':'Chronic Kidney Disease Stage 3','code':'N18.3'},{'name':'Hypertension','code':'I10'}],
    'allergies':[],
    'meds':[{'name':'Losartan 50mg'},{'name':'Ferrous Sulphate 200mg'}],
    'base_health': 'declining_renal'
  },
  { 'docIdx':1, 'fn':'Lakshmi', 'ln':'Raghavan', 'dob':'1948-07-22', 'gender':'Female', 'phone':'+91-98400-55667', 'addr':'Adyar, Chennai', 'email':'lakshmi.raghavan@careguardian.health', 'ec':{'n':'Suresh Raghavan','p':'+91-98400-00004'},
    'conds':[{'name':'Hypothyroidism','code':'E03.9'},{'name':'Atrial Fibrillation','code':'I48.91'},{'name':'Heart Failure','code':'I50.20'}],
    'allergies':[{'sub':'Aspirin','rx':'GI bleeding','sev':'SEVERE'}],
    'meds':[{'name':'Levothyroxine 75mcg'},{'name':'Warfarin 3mg'},{'name':'Bisoprolol 2.5mg'}],
    'base_health': 'critical_cardiac'
  },
  { 'docIdx':1, 'fn':'Mohan', 'ln':'Pillai', 'dob':'1944-11-08', 'gender':'Male', 'phone':'+91-94470-22334', 'addr':'Trivandrum, Kerala', 'email':'mohan.pillai@careguardian.health', 'ec':{'n':'Shyam Pillai','p':'+91-94470-00005'},
    'conds':[{'name':'Parkinson Disease','code':'G20'},{'name':'Depression','code':'F32.9'}],
    'allergies':[],
    'meds':[{'name':'Levodopa Carbidopa 100/25mg'},{'name':'Pramipexole 0.5mg'}],
    'base_health': 'declining_neurological'
  },
  { 'docIdx':1, 'fn':'Kamala', 'ln':'Venkatesh', 'dob':'1952-02-14', 'gender':'Female', 'phone':'+91-99000-45678', 'addr':'Mysuru, Karnataka', 'email':'kamala.venkatesh@careguardian.health', 'ec':{'n':'Vinod Venkatesh','p':'+91-99000-00006'},
    'conds':[{'name':'COPD Moderate Stage','code':'J44.1'},{'name':'Anxiety Disorder','code':'F41.1'}],
    'allergies':[{'sub':'Cephalosporins','rx':'Rash','sev':'MILD'}],
    'meds':[{'name':'Tiotropium 18mcg Inhaler'},{'name':'Salbutamol 100mcg Inhaler'}],
    'base_health': 'stable_respiratory'
  },
  { 'docIdx':2, 'fn':'Krishnamurthy', 'ln':'Swaminathan', 'dob':'1941-05-30', 'gender':'Male', 'phone':'+91-97890-33445', 'addr':'T. Nagar, Chennai', 'email':'krishnamurthy.swaminathan@careguardian.health', 'ec':{'n':'Uma Swaminathan','p':'+91-97890-00007'},
    'conds':[{'name':'Alzheimers Disease Moderate','code':'G30.1'},{'name':'Type 2 Diabetes Mellitus','code':'E11.9'}],
    'allergies':[],
    'meds':[{'name':'Donepezil 10mg'},{'name':'Memantine 10mg'},{'name':'Metformin 500mg'}],
    'base_health': 'critical_cognitive'
  },
  { 'docIdx':2, 'fn':'Radha', 'ln':'Krishnan', 'dob':'1946-09-03', 'gender':'Female', 'phone':'+91-98510-66789', 'addr':'Coimbatore, Tamil Nadu', 'email':'radha.krishnan@careguardian.health', 'ec':{'n':'Arun Krishnan','p':'+91-98510-00008'},
    'conds':[{'name':'Multiple Sclerosis Relapsing-remitting','code':'G35'},{'name':'Bladder Dysfunction','code':'N31.9'}],
    'allergies':[{'sub':'Interferon Beta','rx':'Flu-like symptoms','sev':'MODERATE'}],
    'meds':[{'name':'Dimethyl Fumarate 240mg'},{'name':'Oxybutynin 5mg'}],
    'base_health': 'stable_neurological'
  },
  { 'docIdx':2, 'fn':'Balaji', 'ln':'Subramaniam', 'dob':'1955-12-25', 'gender':'Male', 'phone':'+91-94880-12345', 'addr':'Velachery, Chennai', 'email':'balaji.subramaniam@careguardian.health', 'ec':{'n':'Meena Subramaniam','p':'+91-94880-00009'},
    'conds':[{'name':'Epilepsy Focal','code':'G40.2'},{'name':'Hypertension','code':'I10'}],
    'allergies':[{'sub':'Carbamazepine','rx':'Stevens-Johnson syndrome','sev':'SEVERE'}],
    'meds':[{'name':'Levetiracetam 1000mg'},{'name':'Amlodipine 10mg'}],
    'base_health': 'stable_general'
  },
  { 'docIdx':3, 'fn':'Padmanabhan', 'ln':'Nambiar', 'dob':'1939-04-17', 'gender':'Male', 'phone':'+91-96000-98765', 'addr':'Kozhikode, Kerala', 'email':'padmanabhan.nambiar@careguardian.health', 'ec':{'n':'Sridevi Nambiar','p':'+91-96000-00010'},
    'conds':[{'name':'Ischaemic Heart Disease','code':'I25.10'},{'name':'Congestive Heart Failure','code':'I50.9'},{'name':'Type 2 Diabetes Mellitus','code':'E11.9'}],
    'allergies':[{'sub':'Contrast dye iodine','rx':'Urticaria','sev':'MODERATE'}],
    'meds':[{'name':'Bisoprolol 5mg'},{'name':'Ramipril 5mg'}],
    'base_health': 'critical_cardiac'
  },
  { 'docIdx':3, 'fn':'Janaki', 'ln':'Srinivasan', 'dob':'1953-06-10', 'gender':'Female', 'phone':'+91-90000-23456', 'addr':'Thrissur, Kerala', 'email':'janaki.srinivasan@careguardian.health', 'ec':{'n':'Manohar Srinivasan','p':'+91-90000-00011'},
    'conds':[{'name':'Hypertrophic Cardiomyopathy','code':'I42.1'},{'name':'Dyslipidaemia','code':'E78.5'}],
    'allergies':[],
    'meds':[{'name':'Verapamil 120mg'},{'name':'Rosuvastatin 10mg'}],
    'base_health': 'stable_cardiac'
  },
  { 'docIdx':3, 'fn':'Venkatasubramanian', 'ln':'Iyer', 'dob':'1936-01-01', 'gender':'Male', 'phone':'+91-98660-34567', 'addr':'Ernakulam, Kerala', 'email':'venkatasubramanian.iyer@careguardian.health', 'ec':{'n':'Geetha Iyer','p':'+91-98660-00012'},
    'conds':[{'name':'Complete Heart Block','code':'I44.2'},{'name':'Pacemaker in Situ','code':'Z95.0'}],
    'allergies':[{'sub':'NSAIDs','rx':'Renal impairment','sev':'MODERATE'}],
    'meds':[{'name':'Aspirin 81mg'},{'name':'Atorvastatin 40mg'}],
    'base_health': 'stable_cardiac'
  },
  { 'docIdx':4, 'fn':'Nalini', 'ln':'Chandrasekhar', 'dob':'1958-08-19', 'gender':'Female', 'phone':'+91-94440-56789', 'addr':'Mandya, Karnataka', 'email':'nalini.chandrasekhar@careguardian.health', 'ec':{'n':'Pradeep Chandrasekhar','p':'+91-94440-00013'},
    'conds':[{'name':'Hashimotos Thyroiditis','code':'E06.3'}],
    'allergies':[],
    'meds':[{'name':'Levothyroxine 100mcg'}],
    'base_health': 'stable_general'
  },
  { 'docIdx':4, 'fn':'Shanmugam', 'ln':'Palanichamy', 'dob':'1947-03-27', 'gender':'Male', 'phone':'+91-96000-67890', 'addr':'Madurai, Tamil Nadu', 'email':'shanmugam.palanichamy@careguardian.health', 'ec':{'n':'Kavitha Palanichamy','p':'+91-96000-00014'},
    'conds':[{'name':'Type 1 Diabetes Mellitus','code':'E10.9'},{'name':'Diabetic Nephropathy','code':'E10.21'}],
    'allergies':[{'sub':'Sulphonylureas','rx':'Severe hypoglycaemia','sev':'SEVERE'}],
    'meds':[{'name':'Insulin Aspart NovoRapid'},{'name':'Insulin Glargine Lantus 24 IU'}],
    'base_health': 'declining_metabolic'
  },
  { 'docIdx':4, 'fn':'Bhagyalakshmi', 'ln':'Narayanan', 'dob':'1961-10-05', 'gender':'Female', 'phone':'+91-98760-78901', 'addr':'Tirunelveli, Tamil Nadu', 'email':'bhagyalakshmi.narayanan@careguardian.health', 'ec':{'n':'Ganesh Narayanan','p':'+91-98760-00015'},
    'conds':[{'name':'Cushings Syndrome post-op','code':'E24.0'},{'name':'Osteoporosis secondary','code':'M81.8'}],
    'allergies':[],
    'meds':[{'name':'Hydrocortisone 10/5 mg'},{'name':'Alendronate 70mg'}],
    'base_health': 'stable_general'
  },
]

OBSERVATION_TEMPLATES = {
    'declining_metabolic': [
        ('APPETITE', 'Skipped meals frequently this week, says food tastes bland.'),
        ('MOBILITY', 'Complained of tingling in feet, walking less than usual.'),
        ('SLEEP', 'Waking up multiple times at night to use the restroom.'),
        ('MOOD', 'Seems frustrated with dietary restrictions.'),
    ],
    'stable_mobility': [
        ('MOBILITY', 'Walking normally, went for a 30-minute walk today.'),
        ('PAIN', 'Reported slight joint stiffness in the morning, resolved after moving.'),
        ('SLEEP', 'Sleeping through the night consistently.'),
    ],
    'declining_renal': [
        ('MOBILITY', 'Noticed swelling in ankles, walking seems laborious.'),
        ('APPETITE', 'Nauseous after meals, eating smaller portions.'),
        ('SLEEP', 'Restless sleep, complains of itching at night.'),
    ],
    'critical_cardiac': [
        ('MOBILITY', 'Short of breath after walking just to the kitchen.'),
        ('SLEEP', 'Needs extra pillows to sleep comfortably, coughing at night.'),
        ('APPETITE', 'Eating very little, complains of feeling bloated.'),
        ('CONFUSION', 'Seemed slightly disoriented this morning upon waking.'),
    ],
    'declining_neurological': [
        ('MOBILITY', 'Tremors seem more pronounced today, dropped a cup.'),
        ('MOOD', 'Appears withdrawn and quiet during family visits.'),
        ('SLEEP', 'Vivid dreams and thrashing in sleep reported.'),
    ],
    'stable_respiratory': [
        ('MOBILITY', 'Breathing comfortably while walking around the house.'),
        ('SLEEP', 'No coughing fits tonight, slept well.'),
        ('MOOD', 'Cheerful and energetic today.'),
    ],
    'critical_cognitive': [
        ('CONFUSION', 'Did not recognize neighbor today.'),
        ('CONFUSION', 'Asked the same question about the time repeatedly.'),
        ('MOOD', 'Agitated when trying to find misplaced keys.'),
        ('SLEEP', 'Wandering around the house at 3 AM.'),
    ],
    'stable_neurological': [
        ('MOBILITY', 'Balance is good today, used cane effectively.'),
        ('MOOD', 'In good spirits, engaged in conversation.'),
        ('MEDICATION', 'Took all medications on time without prompting.'),
    ],
    'stable_general': [
        ('APPETITE', 'Eating well, finished all meals.'),
        ('SLEEP', 'Slept for 8 hours undisturbed.'),
        ('MOBILITY', 'Active around the house, doing light chores.'),
    ],
    'stable_cardiac': [
        ('MOBILITY', 'No shortness of breath on regular walks.'),
        ('APPETITE', 'Eating regular heart-healthy meals without complaint.'),
        ('MOOD', 'Feeling good, blood pressure readings are stable.'),
    ]
}

EVENTS_TEMPLATES = {
    'declining_metabolic': [
        ('LAB_RESULT', 'HbA1c increased to 8.5%'),
        ('MEDICATION_CHANGED', 'Insulin dosage adjusted by clinician'),
        ('SYMPTOM', 'Reported increased neuropathy symptoms')
    ],
    'critical_cardiac': [
        ('ER_VISIT', 'Visited ER for acute shortness of breath'),
        ('MEDICATION_CHANGED', 'Diuretic dosage increased'),
        ('SYMPTOM', 'Weight gain of 2kg over 3 days noted')
    ],
    'critical_cognitive': [
        ('NEAR_FALL', 'Tripped on rug while wandering at night'),
        ('COGNITIVE_CHANGE', 'Mini-Mental State Examination score declined by 2 points'),
        ('CAREGIVER_OBSERVATION', 'Increased sundowning symptoms reported by family')
    ],
    'declining_renal': [
        ('LAB_RESULT', 'eGFR dropped to 35 mL/min'),
        ('MEDICATION_CHANGED', 'Blood pressure medication adjusted'),
    ],
    'declining_neurological': [
        ('FALL', 'Minor fall in living room, no injuries'),
        ('MEDICATION_CHANGED', 'Levodopa timing adjusted to manage wearing-off effect')
    ]
}

def generate_seed():
    seed = []
    seed.append("import * as bcrypt from 'bcrypt';")
    seed.append("import { PrismaClient } from '@prisma/client';")
    seed.append("const prisma = new PrismaClient();")
    seed.append("const DAY = 24 * 60 * 60 * 1000;")
    seed.append("const daysAgo = (d: number) => new Date(Date.now() - d * DAY);")
    seed.append("const PASSWORD = 'CareSafe2026!';")
    
    seed.append("async function main() {")
    seed.append("  const passwordHash = await bcrypt.hash(PASSWORD, 10);")
    seed.append("  console.log('Cleaning up...');")
    seed.append("  await prisma.user.deleteMany({});")
    seed.append("  await prisma.organization.deleteMany({});")
    seed.append("  await prisma.patient.deleteMany({});")
    
    seed.append("  console.log('Seeding Orgs...');")
    seed.append("  const orgs = {")
    seed.append("    'Sunrise Senior Care Centre': await prisma.organization.create({data: {name: 'Sunrise Senior Care Centre'}}),")
    seed.append("    'CareFirst Neurology Clinic': await prisma.organization.create({data: {name: 'CareFirst Neurology Clinic'}}),")
    seed.append("    'HeartCare Hospital': await prisma.organization.create({data: {name: 'HeartCare Hospital'}})")
    seed.append("  };")
    
    seed.append("  console.log('Seeding Admin...');")
    seed.append("  const admin = await prisma.user.create({data: {email: 'admin@careguardian.health', name: 'Admin', passwordHash, roles: ['ADMIN']}});")
    
    seed.append("  console.log('Seeding Doctors...');")
    seed.append("  const docs = [];")
    for doc in DOCTORS:
        seed.append(f"  docs.push(await prisma.user.create({{data: {{email: '{doc['email']}', name: '{doc['name']}', passwordHash, roles: ['CLINICIAN'], organizationId: orgs['{doc['org']}'].id}}}}));")
        
    seed.append("  console.log('Seeding Patients and Caregivers with Unique Data...');")
    
    # Generate patients and their unique data
    for i, pt in enumerate(PATIENTS):
        seed.append(f"  // PATIENT {pt['fn']} {pt['ln']}")
        seed.append(f"  const pu_{i} = await prisma.user.create({{data: {{email: '{pt['email']}', name: '{pt['fn']} {pt['ln']}', passwordHash, roles: ['PATIENT']}}}});")
        seed.append(f"  const pt_{i} = await prisma.patient.create({{data: {{id: pu_{i}.id, firstName: '{pt['fn']}', lastName: '{pt['ln']}', dateOfBirth: new Date('{pt['dob']}'), gender: '{pt['gender']}', createdById: admin.id}}}});")
        seed.append(f"  await prisma.patientUserRelationship.create({{data: {{patientId: pt_{i}.id, userId: pu_{i}.id, role: 'PATIENT'}}}});")
        seed.append(f"  await prisma.patientUserRelationship.create({{data: {{patientId: pt_{i}.id, userId: docs[{pt['docIdx']}].id, role: 'CLINICIAN'}}}});")
        
        # Conditions & Meds
        for c in pt['conds']:
            seed.append(f"  await prisma.condition.create({{data: {{patientId: pt_{i}.id, name: '{c['name']}', code: '{c['code']}'}}}});")
        for m in pt['meds']:
            seed.append(f"  await prisma.medication.create({{data: {{patientId: pt_{i}.id, name: '{m['name']}', status: 'ACTIVE'}}}});")
            
        # Caregivers
        f1_email = f"caregiver1_{i}@careguardian.health"
        seed.append(f"  const cg1_{i} = await prisma.user.create({{data: {{email: '{f1_email}', name: '{pt['ec']['n']}', passwordHash, roles: ['FAMILY_CAREGIVER']}}}});")
        seed.append(f"  await prisma.patientUserRelationship.create({{data: {{patientId: pt_{i}.id, userId: cg1_{i}.id, role: 'FAMILY_CAREGIVER'}}}});")
        
        # Unique Observations
        obs_list = OBSERVATION_TEMPLATES.get(pt['base_health'], OBSERVATION_TEMPLATES['stable_general']) * 3
        random.shuffle(obs_list)
        for j, obs in enumerate(obs_list[:6]):
            days = random.randint(1, 14)
            seed.append(f"  await prisma.observation.create({{data: {{patientId: pt_{i}.id, sourceUserId: cg1_{i}.id, sourceType: 'CAREGIVER', category: '{obs[0]}', rawText: '{obs[1]}', structured: {{severity: 'MODERATE'}}, occurredAt: daysAgo({days})}}}});")
            
        # Unique Events
        event_list = EVENTS_TEMPLATES.get(pt['base_health'], [('CHECK_IN', 'Routine check-in completed')]) * 2
        for j, ev in enumerate(event_list[:2]):
            days = random.randint(2, 30)
            seed.append(f"  await prisma.healthEvent.create({{data: {{patientId: pt_{i}.id, type: '{ev[0]}', sourceType: 'SYSTEM', timestamp: daysAgo({days}), description: '{ev[1]}'}}}});")
            
        # Unique Missing Info
        if pt['base_health'].startswith('critical'):
            seed.append(f"  await prisma.missingInformation.create({{data: {{patientId: pt_{i}.id, category: 'URGENT_ASSESSMENT_NEEDED', description: 'Immediate reassessment required due to critical status changes.', severity: 'CRITICAL'}}}});")
        else:
            seed.append(f"  await prisma.missingInformation.create({{data: {{patientId: pt_{i}.id, category: 'ROUTINE_CHECK', description: 'Annual wellness check due next month.', severity: 'NORMAL'}}}});")
            
    seed.append("  console.log('✅ Seeding Completed!');")
    seed.append("}")
    seed.append("main().catch(console.error).finally(() => prisma.$disconnect());")
    
    return "\n".join(seed)

if __name__ == "__main__":
    with open("apps/api/prisma/seed.ts", "w", encoding="utf-8") as f:
        f.write(generate_seed())
    print("New distinct seed.ts generated!")
