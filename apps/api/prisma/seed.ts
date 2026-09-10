import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY);
const dateOf = (s: string) => new Date(s);
const PASSWORD = 'CareSafe2026!';
let passwordHash = '';

const CREDENTIALS: Array<{ type: string; name: string; email: string; role: string; userId?: string }> = [];

const DOCTOR_NAMES = ['Dr. Arjun Nair','Dr. Priya Sharma','Dr. Meera Pillai','Dr. Rajan Menon','Dr. Lakshmi Iyer'];

const DOCTORS = [
  { email:'dr.arjun.nair@careguardian.health', name:'Dr. Arjun Nair', org:'Sunrise Senior Care Centre' },
  { email:'dr.priya.sharma@careguardian.health', name:'Dr. Priya Sharma', org:'Sunrise Senior Care Centre' },
  { email:'dr.meera.pillai@careguardian.health', name:'Dr. Meera Pillai', org:'CareFirst Neurology Clinic' },
  { email:'dr.rajan.menon@careguardian.health', name:'Dr. Rajan Menon', org:'HeartCare Hospital' },
  { email:'dr.lakshmi.iyer@careguardian.health', name:'Dr. Lakshmi Iyer', org:'Sunrise Senior Care Centre' },
];

async function seedOrgs() {
  const orgs = [
    { id:'10000000-0000-4000-8000-000000000001', name:'Sunrise Senior Care Centre' },
    { id:'10000000-0000-4000-8000-000000000002', name:'CareFirst Neurology Clinic' },
    { id:'10000000-0000-4000-8000-000000000003', name:'HeartCare Hospital' },
  ];
  const map: Record<string,string> = {};
  for (const o of orgs) {
    const r = await prisma.organization.upsert({ where:{id:o.id}, update:{}, create:{id:o.id,name:o.name} });
    map[o.name] = r.id;
  }
  return map;
}

async function seedAdmin() {
  const u = await prisma.user.upsert({
    where:{email:'admin@careguardian.health'}, update:{},
    create:{email:'admin@careguardian.health',name:'CareGuardian Admin',passwordHash,roles:['ADMIN']}
  });
  CREDENTIALS.push({type:'ADMIN',name:'CareGuardian Admin',email:'admin@careguardian.health',role:'System Administrator',userId:u.id});
  return u.id;
}

async function seedDoctors(orgMap: Record<string,string>) {
  const ids: string[] = [];
  for (const d of DOCTORS) {
    const orgId = orgMap[d.org]!;
    const u = await prisma.user.upsert({
      where:{email:d.email}, update:{},
      create:{email:d.email,name:d.name,passwordHash,roles:['CLINICIAN'],organizationId:orgId}
    });
    await prisma.organizationMembership.upsert({
      where:{organizationId_userId:{organizationId:orgId,userId:u.id}}, update:{},
      create:{organizationId:orgId,userId:u.id,role:'CLINICIAN'}
    });
    CREDENTIALS.push({type:'CLINICIAN',name:d.name,email:d.email,role:'Clinician at '+d.org,userId:u.id});
    ids.push(u.id);
    console.log('  Doctor: '+d.name+' ('+u.id+')');
  }
  return ids;
}

interface PatDef {
  docIdx:number; fn:string; ln:string; dob:string; gender:string;
  phone:string; addr:string; email:string; ec:{n:string;p:string};
  conds:{name:string;code:string;since:string;status:string;ver:string}[];
  allergies:{sub:string;rx:string;sev:string}[];
  meds:{name:string;gen:string;dose:string;freq:string;since:string;by:string;note?:string}[];
  labs:{test:string;val:string;unit:string;ref:string;date:Date;interp:string}[];
}

const PATIENTS: PatDef[] = [
  { docIdx:0, fn:'Ravi', ln:'Kumar', dob:'1950-03-15', gender:'Male', phone:'+91-98765-43210', addr:'HSR Layout, Bangalore, Karnataka', email:'ravi.kumar@careguardian.health', ec:{n:'Ananya Kumar',p:'+91-98765-00001'},
    conds:[{name:'Type 2 Diabetes Mellitus',code:'E11.9',since:'2014-06-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Hypertension',code:'I10',since:'2012-04-20',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Hyperlipidaemia',code:'E78.5',since:'2016-01-10',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[{sub:'Penicillin',rx:'Rash',sev:'MODERATE'}],
    meds:[{name:'Metformin 1000mg',gen:'metformin',dose:'1000 mg',freq:'twice daily',since:'2014-07-01',by:'Dr. Arjun Nair'},{name:'Amlodipine 5mg',gen:'amlodipine',dose:'5 mg',freq:'once daily',since:'2012-05-01',by:'Dr. Arjun Nair'},{name:'Atorvastatin 20mg',gen:'atorvastatin',dose:'20 mg',freq:'once nightly',since:'2016-02-01',by:'Dr. Arjun Nair'},{name:'Amoxicillin 500mg',gen:'amoxicillin',dose:'500 mg',freq:'three times daily',since:'2026-09-05',by:'Dr. Arjun Nair',note:'FLAGGED potential penicillin allergy conflict'}],
    labs:[{test:'HbA1c',val:'7.8',unit:'%',ref:'4.0-5.6',date:daysAgo(45),interp:'Elevated'},{test:'Creatinine',val:'1.3',unit:'mg/dL',ref:'0.7-1.2',date:daysAgo(45),interp:'High-normal'}] },
  { docIdx:0, fn:'Sunita', ln:'Balasubramanian', dob:'1948-11-22', gender:'Female', phone:'+91-96300-78901', addr:'Koramangala, Bangalore', email:'sunita.balasubramanian@careguardian.health', ec:{n:'Karthik Balasubramanian',p:'+91-96300-00002'},
    conds:[{name:'Osteoporosis',code:'M81.0',since:'2018-03-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Rheumatoid Arthritis',code:'M06.9',since:'2015-09-14',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[{sub:'Sulfonamides',rx:'Hives',sev:'MODERATE'}],
    meds:[{name:'Alendronate 70mg',gen:'alendronate',dose:'70 mg',freq:'once weekly',since:'2018-04-01',by:'Dr. Arjun Nair'},{name:'Methotrexate 10mg',gen:'methotrexate',dose:'10 mg',freq:'once weekly',since:'2015-10-01',by:'Dr. Arjun Nair'},{name:'Folic Acid 5mg',gen:'folic acid',dose:'5 mg',freq:'once daily',since:'2015-10-07',by:'Dr. Arjun Nair'}],
    labs:[{test:'ESR',val:'62',unit:'mm/hr',ref:'0-30',date:daysAgo(30),interp:'Elevated'},{test:'Haemoglobin',val:'10.2',unit:'g/dL',ref:'12-16',date:daysAgo(30),interp:'Low'}] },
  { docIdx:0, fn:'Gopalan', ln:'Rajan', dob:'1943-07-08', gender:'Male', phone:'+91-94440-11223', addr:'Malleswaram, Bangalore', email:'gopalan.rajan@careguardian.health', ec:{n:'Kavitha Rajan',p:'+91-94440-00003'},
    conds:[{name:'Chronic Kidney Disease Stage 3',code:'N18.3',since:'2019-05-15',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Hypertension',code:'I10',since:'2009-01-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[],
    meds:[{name:'Losartan 50mg',gen:'losartan',dose:'50 mg',freq:'once daily',since:'2009-03-01',by:'Dr. Arjun Nair'},{name:'Ferrous Sulphate 200mg',gen:'ferrous sulphate',dose:'200 mg',freq:'twice daily',since:'2020-03-01',by:'Dr. Arjun Nair'}],
    labs:[{test:'eGFR',val:'38',unit:'mL/min',ref:'>60',date:daysAgo(30),interp:'Reduced CKD Stage 3'},{test:'Haemoglobin',val:'9.8',unit:'g/dL',ref:'13.5-17.5',date:daysAgo(30),interp:'Low'}] },
  { docIdx:1, fn:'Lakshmi', ln:'Raghavan', dob:'1948-07-22', gender:'Female', phone:'+91-98400-55667', addr:'Adyar, Chennai', email:'lakshmi.raghavan@careguardian.health', ec:{n:'Suresh Raghavan',p:'+91-98400-00004'},
    conds:[{name:'Hypothyroidism',code:'E03.9',since:'2011-08-12',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Atrial Fibrillation',code:'I48.91',since:'2020-11-05',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Heart Failure with reduced EF',code:'I50.20',since:'2021-01-18',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[{sub:'Aspirin',rx:'GI bleeding',sev:'SEVERE'}],
    meds:[{name:'Levothyroxine 75mcg',gen:'levothyroxine',dose:'75 mcg',freq:'once daily fasting',since:'2011-09-01',by:'Dr. Priya Sharma'},{name:'Warfarin 3mg',gen:'warfarin',dose:'3 mg',freq:'once daily',since:'2020-12-01',by:'Dr. Priya Sharma'},{name:'Bisoprolol 2.5mg',gen:'bisoprolol',dose:'2.5 mg',freq:'once daily',since:'2021-02-01',by:'Dr. Priya Sharma'},{name:'Furosemide 40mg',gen:'furosemide',dose:'40 mg',freq:'once daily',since:'2021-02-01',by:'Dr. Priya Sharma'}],
    labs:[{test:'TSH',val:'4.8',unit:'mIU/L',ref:'0.4-4.0',date:daysAgo(45),interp:'Slightly elevated'},{test:'INR',val:'2.3',unit:'',ref:'2.0-3.0',date:daysAgo(14),interp:'Therapeutic'},{test:'BNP',val:'420',unit:'pg/mL',ref:'<100',date:daysAgo(60),interp:'Elevated heart failure'}] },
  { docIdx:1, fn:'Mohan', ln:'Pillai', dob:'1944-11-08', gender:'Male', phone:'+91-94470-22334', addr:'Trivandrum, Kerala', email:'mohan.pillai@careguardian.health', ec:{n:'Shyam Pillai',p:'+91-94470-00005'},
    conds:[{name:'Parkinson Disease',code:'G20',since:'2017-04-22',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Depression',code:'F32.9',since:'2019-06-30',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[],
    meds:[{name:'Levodopa Carbidopa 100/25mg',gen:'levodopa carbidopa',dose:'100/25 mg',freq:'four times daily',since:'2017-05-01',by:'Dr. Priya Sharma'},{name:'Pramipexole 0.5mg',gen:'pramipexole',dose:'0.5 mg',freq:'three times daily',since:'2017-05-01',by:'Dr. Priya Sharma'},{name:'Sertraline 50mg',gen:'sertraline',dose:'50 mg',freq:'once daily',since:'2019-07-10',by:'Dr. Priya Sharma'}],
    labs:[{test:'UPDRS Score',val:'38',unit:'/108',ref:'<20 mild',date:daysAgo(90),interp:'Moderate motor impairment'}] },
  { docIdx:1, fn:'Kamala', ln:'Venkatesh', dob:'1952-02-14', gender:'Female', phone:'+91-99000-45678', addr:'Mysuru, Karnataka', email:'kamala.venkatesh@careguardian.health', ec:{n:'Vinod Venkatesh',p:'+91-99000-00006'},
    conds:[{name:'COPD Moderate Stage',code:'J44.1',since:'2016-09-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Anxiety Disorder',code:'F41.1',since:'2020-03-15',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[{sub:'Cephalosporins',rx:'Rash',sev:'MILD'}],
    meds:[{name:'Tiotropium 18mcg Inhaler',gen:'tiotropium',dose:'18 mcg',freq:'once daily inhaled',since:'2016-10-01',by:'Dr. Priya Sharma'},{name:'Salbutamol 100mcg Inhaler',gen:'salbutamol',dose:'100 mcg',freq:'as needed',since:'2016-10-01',by:'Dr. Priya Sharma'},{name:'Escitalopram 10mg',gen:'escitalopram',dose:'10 mg',freq:'once daily',since:'2020-04-01',by:'Dr. Priya Sharma'}],
    labs:[{test:'FEV1',val:'55',unit:'% predicted',ref:'>70%',date:daysAgo(90),interp:'Moderate obstruction'},{test:'SpO2',val:'93',unit:'%',ref:'95-100%',date:daysAgo(7),interp:'Mildly reduced'}] },
  { docIdx:2, fn:'Krishnamurthy', ln:'Swaminathan', dob:'1941-05-30', gender:'Male', phone:'+91-97890-33445', addr:'T. Nagar, Chennai', email:'krishnamurthy.swaminathan@careguardian.health', ec:{n:'Uma Swaminathan',p:'+91-97890-00007'},
    conds:[{name:'Alzheimers Disease Moderate',code:'G30.1',since:'2020-01-15',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Type 2 Diabetes Mellitus',code:'E11.9',since:'2008-11-20',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[],
    meds:[{name:'Donepezil 10mg',gen:'donepezil',dose:'10 mg',freq:'once nightly',since:'2020-02-01',by:'Dr. Meera Pillai'},{name:'Memantine 10mg',gen:'memantine',dose:'10 mg',freq:'twice daily',since:'2021-03-01',by:'Dr. Meera Pillai'},{name:'Metformin 500mg',gen:'metformin',dose:'500 mg',freq:'twice daily',since:'2008-12-01',by:'Dr. Meera Pillai'}],
    labs:[{test:'MMSE',val:'16',unit:'/30',ref:'>24 normal',date:daysAgo(60),interp:'Moderate dementia range'},{test:'HbA1c',val:'8.1',unit:'%',ref:'4.0-5.6',date:daysAgo(60),interp:'Poorly controlled'}] },
  { docIdx:2, fn:'Radha', ln:'Krishnan', dob:'1946-09-03', gender:'Female', phone:'+91-98510-66789', addr:'Coimbatore, Tamil Nadu', email:'radha.krishnan@careguardian.health', ec:{n:'Arun Krishnan',p:'+91-98510-00008'},
    conds:[{name:'Multiple Sclerosis Relapsing-remitting',code:'G35',since:'2013-07-20',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Bladder Dysfunction',code:'N31.9',since:'2015-01-01',status:'ACTIVE',ver:'DOCUMENTED'}],
    allergies:[{sub:'Interferon Beta',rx:'Flu-like symptoms and injection site reactions',sev:'MODERATE'}],
    meds:[{name:'Dimethyl Fumarate 240mg',gen:'dimethyl fumarate',dose:'240 mg',freq:'twice daily',since:'2018-03-01',by:'Dr. Meera Pillai'},{name:'Oxybutynin 5mg',gen:'oxybutynin',dose:'5 mg',freq:'three times daily',since:'2015-02-01',by:'Dr. Meera Pillai'}],
    labs:[{test:'Lymphocyte Count',val:'0.8',unit:'x10e9/L',ref:'1.0-4.5',date:daysAgo(45),interp:'Low'}] },
  { docIdx:2, fn:'Balaji', ln:'Subramaniam', dob:'1955-12-25', gender:'Male', phone:'+91-94880-12345', addr:'Velachery, Chennai', email:'balaji.subramaniam@careguardian.health', ec:{n:'Meena Subramaniam',p:'+91-94880-00009'},
    conds:[{name:'Epilepsy Focal',code:'G40.2',since:'2010-03-10',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Hypertension',code:'I10',since:'2017-05-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[{sub:'Carbamazepine',rx:'Stevens-Johnson syndrome',sev:'SEVERE'}],
    meds:[{name:'Levetiracetam 1000mg',gen:'levetiracetam',dose:'1000 mg',freq:'twice daily',since:'2010-04-01',by:'Dr. Meera Pillai'},{name:'Lamotrigine 100mg',gen:'lamotrigine',dose:'100 mg',freq:'twice daily',since:'2014-01-01',by:'Dr. Meera Pillai'},{name:'Amlodipine 10mg',gen:'amlodipine',dose:'10 mg',freq:'once daily',since:'2017-06-01',by:'Dr. Meera Pillai'}],
    labs:[{test:'Levetiracetam Level',val:'42',unit:'mcg/mL',ref:'12-46',date:daysAgo(30),interp:'Therapeutic'}] },
  { docIdx:3, fn:'Padmanabhan', ln:'Nambiar', dob:'1939-04-17', gender:'Male', phone:'+91-96000-98765', addr:'Kozhikode, Kerala', email:'padmanabhan.nambiar@careguardian.health', ec:{n:'Sridevi Nambiar',p:'+91-96000-00010'},
    conds:[{name:'Ischaemic Heart Disease',code:'I25.10',since:'2015-08-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Congestive Heart Failure',code:'I50.9',since:'2018-11-20',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Type 2 Diabetes Mellitus',code:'E11.9',since:'2010-02-14',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[{sub:'Contrast dye iodine',rx:'Urticaria',sev:'MODERATE'}],
    meds:[{name:'Bisoprolol 5mg',gen:'bisoprolol',dose:'5 mg',freq:'once daily',since:'2015-09-01',by:'Dr. Rajan Menon'},{name:'Ramipril 5mg',gen:'ramipril',dose:'5 mg',freq:'once daily',since:'2018-12-01',by:'Dr. Rajan Menon'},{name:'Clopidogrel 75mg',gen:'clopidogrel',dose:'75 mg',freq:'once daily',since:'2015-09-01',by:'Dr. Rajan Menon'}],
    labs:[{test:'Ejection Fraction',val:'38',unit:'%',ref:'>55%',date:daysAgo(60),interp:'Reduced HFrEF'},{test:'BNP',val:'890',unit:'pg/mL',ref:'<100',date:daysAgo(30),interp:'Markedly elevated'},{test:'HbA1c',val:'8.4',unit:'%',ref:'4.0-5.6',date:daysAgo(45),interp:'Poorly controlled'}] },
  { docIdx:3, fn:'Janaki', ln:'Srinivasan', dob:'1953-06-10', gender:'Female', phone:'+91-90000-23456', addr:'Thrissur, Kerala', email:'janaki.srinivasan@careguardian.health', ec:{n:'Manohar Srinivasan',p:'+91-90000-00011'},
    conds:[{name:'Hypertrophic Cardiomyopathy',code:'I42.1',since:'2019-03-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Dyslipidaemia',code:'E78.5',since:'2016-07-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[],
    meds:[{name:'Verapamil 120mg',gen:'verapamil',dose:'120 mg',freq:'three times daily',since:'2019-04-01',by:'Dr. Rajan Menon'},{name:'Rosuvastatin 10mg',gen:'rosuvastatin',dose:'10 mg',freq:'once daily',since:'2016-08-01',by:'Dr. Rajan Menon'}],
    labs:[{test:'LDL Cholesterol',val:'88',unit:'mg/dL',ref:'<70 target',date:daysAgo(45),interp:'Slightly above target'}] },
  { docIdx:3, fn:'Venkatasubramanian', ln:'Iyer', dob:'1936-01-01', gender:'Male', phone:'+91-98660-34567', addr:'Ernakulam, Kerala', email:'venkatasubramanian.iyer@careguardian.health', ec:{n:'Geetha Iyer',p:'+91-98660-00012'},
    conds:[{name:'Complete Heart Block',code:'I44.2',since:'2022-09-15',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Pacemaker in Situ',code:'Z95.0',since:'2022-09-20',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[{sub:'NSAIDs',rx:'Renal impairment',sev:'MODERATE'}],
    meds:[{name:'Aspirin 81mg',gen:'aspirin',dose:'81 mg',freq:'once daily',since:'2022-09-20',by:'Dr. Rajan Menon'},{name:'Atorvastatin 40mg',gen:'atorvastatin',dose:'40 mg',freq:'once nightly',since:'2022-09-20',by:'Dr. Rajan Menon'}],
    labs:[{test:'eGFR',val:'58',unit:'mL/min',ref:'>60',date:daysAgo(45),interp:'Mildly reduced'}] },
  { docIdx:4, fn:'Nalini', ln:'Chandrasekhar', dob:'1958-08-19', gender:'Female', phone:'+91-94440-56789', addr:'Mandya, Karnataka', email:'nalini.chandrasekhar@careguardian.health', ec:{n:'Pradeep Chandrasekhar',p:'+91-94440-00013'},
    conds:[{name:'Hashimotos Thyroiditis with Hypothyroidism',code:'E06.3',since:'2009-02-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[],
    meds:[{name:'Levothyroxine 100mcg',gen:'levothyroxine',dose:'100 mcg',freq:'once daily fasting',since:'2009-03-01',by:'Dr. Lakshmi Iyer'},{name:'Selenium 200mcg',gen:'selenium',dose:'200 mcg',freq:'once daily',since:'2021-01-01',by:'Dr. Lakshmi Iyer'}],
    labs:[{test:'TSH',val:'2.1',unit:'mIU/L',ref:'0.4-4.0',date:daysAgo(60),interp:'Well controlled'},{test:'Anti-TPO antibodies',val:'280',unit:'IU/mL',ref:'<34',date:daysAgo(90),interp:'Elevated'}] },
  { docIdx:4, fn:'Shanmugam', ln:'Palanichamy', dob:'1947-03-27', gender:'Male', phone:'+91-96000-67890', addr:'Madurai, Tamil Nadu', email:'shanmugam.palanichamy@careguardian.health', ec:{n:'Kavitha Palanichamy',p:'+91-96000-00014'},
    conds:[{name:'Type 1 Diabetes Mellitus',code:'E10.9',since:'1978-06-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Diabetic Nephropathy',code:'E10.21',since:'2014-04-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Diabetic Retinopathy',code:'E10.319',since:'2016-08-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[{sub:'Sulphonylureas',rx:'Severe hypoglycaemia',sev:'SEVERE'}],
    meds:[{name:'Insulin Aspart NovoRapid',gen:'insulin aspart',dose:'Variable per sliding scale',freq:'three times daily with meals',since:'1978-07-01',by:'Dr. Lakshmi Iyer'},{name:'Insulin Glargine Lantus 24 IU',gen:'insulin glargine',dose:'24 IU',freq:'once daily bedtime',since:'2005-01-01',by:'Dr. Lakshmi Iyer'},{name:'Lisinopril 10mg',gen:'lisinopril',dose:'10 mg',freq:'once daily',since:'2014-05-01',by:'Dr. Lakshmi Iyer'}],
    labs:[{test:'HbA1c',val:'8.9',unit:'%',ref:'4.0-5.6',date:daysAgo(45),interp:'Suboptimal'},{test:'eGFR',val:'42',unit:'mL/min',ref:'>60',date:daysAgo(45),interp:'Reduced'},{test:'Urine ACR',val:'145',unit:'mg/g',ref:'<30',date:daysAgo(45),interp:'Macroalbuminuria'}] },
  { docIdx:4, fn:'Bhagyalakshmi', ln:'Narayanan', dob:'1961-10-05', gender:'Female', phone:'+91-98760-78901', addr:'Tirunelveli, Tamil Nadu', email:'bhagyalakshmi.narayanan@careguardian.health', ec:{n:'Ganesh Narayanan',p:'+91-98760-00015'},
    conds:[{name:'Cushings Syndrome post-op adrenal adenoma',code:'E24.0',since:'2020-07-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'},{name:'Osteoporosis secondary',code:'M81.8',since:'2020-08-01',status:'ACTIVE',ver:'CLINICALLY_VERIFIED'}],
    allergies:[],
    meds:[{name:'Hydrocortisone 10mg morning 5mg evening',gen:'hydrocortisone',dose:'10/5 mg',freq:'twice daily',since:'2020-08-15',by:'Dr. Lakshmi Iyer'},{name:'Alendronate 70mg',gen:'alendronate',dose:'70 mg',freq:'once weekly',since:'2020-09-01',by:'Dr. Lakshmi Iyer'},{name:'Calcium 1000mg with Vit D3',gen:'calcium carbonate',dose:'1000 mg plus 800 IU',freq:'once daily',since:'2020-09-01',by:'Dr. Lakshmi Iyer'}],
    labs:[{test:'24h Urinary Free Cortisol',val:'22',unit:'mcg/24h',ref:'10-55',date:daysAgo(30),interp:'Normal post-operatively'},{test:'DEXA T-score',val:'-2.5',unit:'SD',ref:'>-1.0',date:daysAgo(180),interp:'Osteoporosis'}] },
];

async function seedPatientsAndCaregivers(doctorIds: string[], adminId: string) {
  const patientIds: string[] = [];

  for (const pd of PATIENTS) {
    const docId = doctorIds[pd.docIdx]!;
    const docName = DOCTOR_NAMES[pd.docIdx]!;

    const pu = await prisma.user.upsert({
      where:{email:pd.email}, update:{},
      create:{email:pd.email,name:pd.fn+' '+pd.ln,passwordHash,roles:['PATIENT']}
    });
    const patient = await prisma.patient.upsert({
      where:{id:pu.id}, update:{},
      create:{id:pu.id,firstName:pd.fn,lastName:pd.ln,dateOfBirth:dateOf(pd.dob),gender:pd.gender,phone:pd.phone,email:pd.email,address:pd.addr,emergencyContactName:pd.ec.n,emergencyContactPhone:pd.ec.p,timezone:'Asia/Kolkata',preferredLanguage:'en',createdById:adminId}
    });
    patientIds.push(patient.id);
    CREDENTIALS.push({type:'PATIENT',name:pd.fn+' '+pd.ln,email:pd.email,role:'Patient under '+docName,userId:patient.id});

    await prisma.patientUserRelationship.upsert({where:{patientId_userId:{patientId:patient.id,userId:pu.id}},update:{},create:{patientId:patient.id,userId:pu.id,role:'PATIENT'}});
    await prisma.patientUserRelationship.upsert({where:{patientId_userId:{patientId:patient.id,userId:docId}},update:{},create:{patientId:patient.id,userId:docId,role:'CLINICIAN'}});

    if (pd.conds.length) await prisma.condition.createMany({skipDuplicates:true,data:pd.conds.map(c=>({patientId:patient.id,name:c.name,code:c.code,codeSystem:'ICD-10',diagnosedAt:dateOf(c.since),status:c.status,verificationStatus:c.ver as any}))});
    if (pd.allergies.length) await prisma.allergy.createMany({skipDuplicates:true,data:pd.allergies.map(a=>({patientId:patient.id,allergen:a.sub,reaction:a.rx,severity:a.sev,verificationStatus:'DOCUMENTED',recordedAt:daysAgo(365)}))});
    for (const m of pd.meds) await prisma.medication.create({data:{patientId:patient.id,name:m.name,genericName:m.gen,dosage:m.dose,frequency:m.freq,route:'oral',startedAt:dateOf(m.since),status:'ACTIVE',prescribedBy:m.by,notes:m.note??null}});
    for (const l of pd.labs) await prisma.labResult.create({data:{patientId:patient.id,testName:l.test,value:l.val,unit:l.unit||null,referenceRange:l.ref||null,collectedAt:l.date,interpretation:l.interp||null}});

    const rand = (max: number) => Math.floor(Math.random() * max);
    const randEl = <T>(arr: readonly T[] | T[]): T => arr[rand(arr.length)] as T;
    const severityLevels = ['NORMAL', 'MILD', 'MODERATE', 'SEVERE'] as const;
    
    // Dynamic base observations
    const cats=['CONFUSION','APPETITE','MOBILITY','SLEEP','MOOD'] as const;
    const baseObs = cats.flatMap((c,ci) => Array.from({length: rand(4)+2}, (_,i) => {
      const sev = severityLevels[rand(3)];
      return {
        patientId: patient.id,
        sourceType: 'CAREGIVER' as const,
        category: c,
        rawText: `Routine observation for ${pd.fn} regarding ${c.toLowerCase()}.`,
        structured: { severity: sev },
        severity: sev === 'NORMAL' ? null : sev,
        occurredAt: daysAgo(rand(60) + 10),
        verificationStatus: 'REPORTED' as const
      };
    }));
    await prisma.observation.createMany({data: baseObs as never});

    // Recent dynamic observations
    const recentObsText = [
      "Seemed a bit confused today.",
      "Ate less than usual.",
      "Walking slower today.",
      "Had trouble sleeping last night.",
      "Felt very tired.",
      "Complained of minor pain."
    ];
    const recentObs = Array.from({length: rand(3)+2}, (_,i) => ({
      patientId: patient.id,
      sourceType: 'CAREGIVER',
      category: randEl(cats),
      rawText: randEl(recentObsText),
      structured: { severity: 'MODERATE' },
      severity: 'MODERATE',
      occurredAt: daysAgo(rand(5) + 1),
      verificationStatus: 'REPORTED'
    }));
    await prisma.observation.createMany({data: recentObs as never});

    // Dynamic events
    const eventTypes = ['MEDICATION_CHANGED', 'NEAR_FALL', 'APPETITE_CHANGE', 'COGNITIVE_CHANGE', 'CHECK_IN'];
    const events = Array.from({length: rand(4)+1}, (_,i) => {
      const type = randEl(eventTypes);
      return {
        patientId: patient.id,
        type,
        timestamp: daysAgo(rand(40)+1),
        sourceType: type === 'CHECK_IN' ? 'SYSTEM' : 'CAREGIVER',
        status: 'REPORTED',
        confidence: 0.8,
        description: `Logged event for ${type.toLowerCase().replace('_', ' ')}`,
        metadata: {}
      };
    });
    await prisma.healthEvent.createMany({data: events as never});

    // Dynamic memory facts
    await prisma.healthMemoryFact.createMany({data:[
      {patientId:patient.id,memoryType:'FACT',category:'general',content:`${pd.fn} is typically independent with basic ADLs.`,provenance:{source:'SYSTEM'}},
      {patientId:patient.id,memoryType:'OBSERVATION',category:'mood',content:`${pd.fn} usually enjoys visits from family.`,provenance:{source:'CAREGIVER'}}
    ]});

    // Dynamic missing info
    const missingCats = ['COGNITIVE_ASSESSMENT', 'FALL_RISK_ASSESSMENT', 'MEDICATION_RECONCILIATION', 'ANNUAL_WELLNESS'];
    await prisma.missingInformation.createMany({data:[
      {patientId:patient.id,category:randEl(missingCats),description:'Assessment is due for review.',severity:'REVIEW',status:'OPEN'},
      {patientId:patient.id,category:randEl(missingCats),description:'Outdated information, please update.',severity:'ATTENTION',status:'OPEN'}
    ] as never});

    console.log('  Patient: '+pd.fn+' '+pd.ln+' ('+patient.id+')');
  }

  const families = [
    { pi:0, members:[
      {fn:'Ananya',ln:'Kumar',email:'ananya.kumar@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Daughter'},
      {fn:'Suresh',ln:'Kumar',email:'suresh.kumar@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Son'},
      {fn:'Meena',ln:'Iyer',email:'meena.iyer@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Neighbour'},
      {fn:'Rahul',ln:'Mehta',email:'rahul.mehta@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Family Friend'},
    ]},
    { pi:3, members:[
      {fn:'Suresh',ln:'Raghavan',email:'suresh.raghavan@careguardian.health',role:'GUARDIAN',rel:'Husband'},
      {fn:'Divya',ln:'Raghavan',email:'divya.raghavan@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Daughter-in-law'},
      {fn:'Aakash',ln:'Raghavan',email:'aakash.raghavan@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Grandson'},
      {fn:'Sujata',ln:'Narayanan',email:'sujata.narayanan@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Sister'},
    ]},
    { pi:6, members:[
      {fn:'Uma',ln:'Swaminathan',email:'uma.swaminathan@careguardian.health',role:'GUARDIAN',rel:'Wife'},
      {fn:'Arjun',ln:'Swaminathan',email:'arjun.swaminathan@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Son'},
      {fn:'Latha',ln:'Reddy',email:'latha.reddy@careguardian.health',role:'PROFESSIONAL_CAREGIVER',rel:'Professional Caregiver'},
      {fn:'Geetha',ln:'Swaminathan',email:'geetha.swaminathan@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Daughter'},
    ]},
    { pi:9, members:[
      {fn:'Sridevi',ln:'Nambiar',email:'sridevi.nambiar@careguardian.health',role:'GUARDIAN',rel:'Wife'},
      {fn:'Priya',ln:'Nambiar',email:'priya.nambiar@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Daughter'},
      {fn:'Ajith',ln:'Nambiar',email:'ajith.nambiar@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Son'},
      {fn:'Beena',ln:'Nair',email:'beena.nair@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Sister-in-law'},
    ]},
    { pi:13, members:[
      {fn:'Kavitha',ln:'Palanichamy',email:'kavitha.palanichamy@careguardian.health',role:'GUARDIAN',rel:'Wife'},
      {fn:'Dinesh',ln:'Palanichamy',email:'dinesh.palanichamy@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Son'},
      {fn:'Mahalakshmi',ln:'Palanichamy',email:'mahalakshmi.palanichamy@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Daughter'},
      {fn:'Ramamurthy',ln:'Palanichamy',email:'ramamurthy.palanichamy@careguardian.health',role:'FAMILY_CAREGIVER',rel:'Brother'},
    ]},
  ];

  for (const fam of families) {
    const pid = patientIds[fam.pi]!;
    const pt = PATIENTS[fam.pi]!;
    for (const m of fam.members) {
      const u = await prisma.user.upsert({where:{email:m.email},update:{},create:{email:m.email,name:m.fn+' '+m.ln,passwordHash,roles:[m.role as any]}});
      await prisma.patientUserRelationship.upsert({where:{patientId_userId:{patientId:pid,userId:u.id}},update:{},create:{patientId:pid,userId:u.id,role:m.role as any}});
      try { await prisma.guardianRelationship.create({data:{patientId:pid,guardianUserId:u.id,relationship:m.rel,startsAt:daysAgo(365*3),status:'ACTIVE'}}); } catch(_){}
      CREDENTIALS.push({type:'CAREGIVER',name:m.fn+' '+m.ln,email:m.email,role:m.role+' - '+m.rel+' of '+pt.fn+' '+pt.ln,userId:u.id});
      console.log('  Caregiver: '+m.fn+' '+m.ln+' ('+m.rel+' of '+pt.fn+')');
    }
  }
}

async function cleanup() {
  const emails = ['admin@careguardian.health','dr.arjun.nair@careguardian.health','dr.priya.sharma@careguardian.health','dr.meera.pillai@careguardian.health','dr.rajan.menon@careguardian.health','dr.lakshmi.iyer@careguardian.health','ravi.kumar@careguardian.health','sunita.balasubramanian@careguardian.health','gopalan.rajan@careguardian.health','lakshmi.raghavan@careguardian.health','mohan.pillai@careguardian.health','kamala.venkatesh@careguardian.health','krishnamurthy.swaminathan@careguardian.health','radha.krishnan@careguardian.health','balaji.subramaniam@careguardian.health','padmanabhan.nambiar@careguardian.health','janaki.srinivasan@careguardian.health','venkatasubramanian.iyer@careguardian.health','nalini.chandrasekhar@careguardian.health','shanmugam.palanichamy@careguardian.health','bhagyalakshmi.narayanan@careguardian.health','ananya.kumar@careguardian.health','suresh.kumar@careguardian.health','meena.iyer@careguardian.health','rahul.mehta@careguardian.health','suresh.raghavan@careguardian.health','divya.raghavan@careguardian.health','aakash.raghavan@careguardian.health','sujata.narayanan@careguardian.health','uma.swaminathan@careguardian.health','arjun.swaminathan@careguardian.health','latha.reddy@careguardian.health','geetha.swaminathan@careguardian.health','sridevi.nambiar@careguardian.health','priya.nambiar@careguardian.health','ajith.nambiar@careguardian.health','beena.nair@careguardian.health','kavitha.palanichamy@careguardian.health','dinesh.palanichamy@careguardian.health','mahalakshmi.palanichamy@careguardian.health','ramamurthy.palanichamy@careguardian.health'];
  const users = await prisma.user.findMany({where:{email:{in:emails}}});
  const patEmails = emails.slice(6,21);
  const patUsers = users.filter(u=>patEmails.includes(u.email));
  for (const pu of patUsers) {
    const pid = pu.id;
    const tables = ['permission','consent','guardianRelationship','patientOrganizationRelationship','patientUserRelationship','notification','document','assessment','encounter','labResult','observation','medicationEvent','medication','healthEvent','episode','allergy','condition','healthMemoryFact','missingInformation','contradiction','agentRun','riskSignal','baseline'];
    for (const t of tables) { try { await (prisma as any)[t].deleteMany({where:{patientId:pid}}); } catch(_){} }
    await prisma.patient.deleteMany({where:{id:pid}}).catch(()=>{});
  }
  const uids = users.map(u=>u.id);
  await prisma.organizationMembership.deleteMany({where:{userId:{in:uids}}}).catch(()=>{});
  await prisma.user.deleteMany({where:{id:{in:uids}}}).catch(()=>{});
}

async function main() {
  console.log('=== CareGuardian DB Seed ===');
  passwordHash = await bcrypt.hash(PASSWORD, 10);
  await cleanup();
  const orgMap = await seedOrgs();
  const adminId = await seedAdmin();
  const doctorIds = await seedDoctors(orgMap);
  await seedPatientsAndCaregivers(doctorIds, adminId);
  console.log('\n=== Seed complete. Total accounts: '+CREDENTIALS.length+' ===');
  for (const c of CREDENTIALS) console.log('['+c.type+'] '+c.name+' | '+c.email+' | '+c.role+' | ID: '+c.userId);
}

main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await prisma.$disconnect();});
