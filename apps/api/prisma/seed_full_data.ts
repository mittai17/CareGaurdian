import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const da = (n: number) => new Date(Date.now() - n * DAY);

const PATIENTS = [
  { id: "66c67bf7-f6e3-478e-b972-20d7d25b4958", risk: "Critical" },
  { id: "33ec2506-2cfd-437d-8c66-defd67159f29", risk: "Moderate" },
  { id: "a9f1ca74-032e-465f-b153-54365602c4ca", risk: "High" },
  { id: "eaf97dad-41d4-4e48-a345-5f1d3f0f5380", risk: "High" },
  { id: "3489a162-e878-493a-92e3-ad33476afc55", risk: "Critical" },
  { id: "2275974a-33b5-4f1d-aa97-79b60c26893e", risk: "Moderate" },
  { id: "5b29040a-ea76-4cf3-9d2c-f63c70fcd419", risk: "High" },
  { id: "f400c4b2-e9be-4223-ac3a-342868fd48d6", risk: "Stable" },
  { id: "95007ae1-f846-4543-9446-5bdf68ddfd32", risk: "High" },
  { id: "d47beac5-3a09-4722-94bf-7cae9f8a081f", risk: "Moderate" },
  { id: "12d12b80-9848-4130-89ba-10f6334c6899", risk: "Critical" },
  { id: "a54594c5-bf6f-4f0b-bcca-b3df6ce952c6", risk: "Stable" },
  { id: "ea413a16-5149-4dd9-905b-d3f62508e931", risk: "Moderate" },
  { id: "e442022e-1232-4ccb-b5bc-c6b3bbcc67cb", risk: "Critical" },
  { id: "3a681eb3-f656-48ae-ba48-353c5f0a8a4f", risk: "Stable" },
];

type ObsRow = { cat: string; text: string; sev: string | null; src: string; days: number };
const OBS: Record<string, ObsRow[]> = {
  "66c67bf7-f6e3-478e-b972-20d7d25b4958": [
    { cat:"MOOD",  text:"Ravi appeared anxious and worried about his blood sugar. Said he feels hopeless at times.", sev:"ATTENTION", src:"CAREGIVER", days:1 },
    { cat:"APPETITE", text:"Skipped dinner. Said he wasn't hungry. Wife noticed he barely ate lunch either.",        sev:"ATTENTION", src:"CAREGIVER", days:2 },
    { cat:"SLEEP", text:"Woke up at 3 AM with profuse sweating. Possibly hypoglycaemic episode.",                   sev:"REVIEW",   src:"CAREGIVER", days:3 },
    { cat:"MOBILITY",text:"Walking steadily today. Completed morning walk of 20 minutes.",                          sev:null,       src:"CAREGIVER", days:5 },
    { cat:"CONFUSION",text:"Very alert. Recognized all family members correctly.",                                   sev:null,       src:"CAREGIVER", days:7 },
  ],
  "33ec2506-2cfd-437d-8c66-defd67159f29": [
    { cat:"PAIN",    text:"Significant joint pain in both hands, rating 7/10. Took extra paracetamol.",  sev:"REVIEW",   src:"PATIENT",   days:1 },
    { cat:"MOBILITY",text:"Struggled to climb stairs. Needed handrail both ways.",                       sev:"ATTENTION", src:"CAREGIVER", days:3 },
    { cat:"SLEEP",   text:"Slept well, approximately 7 hours. No nighttime awakenings.",                 sev:null,        src:"PATIENT",   days:5 },
    { cat:"MOOD",    text:"More cheerful today after video call with grandchildren.",                     sev:null,        src:"CAREGIVER", days:7 },
    { cat:"APPETITE",text:"Ate full meals today. Enjoyed the rice and lentil soup at lunch.",            sev:null,        src:"CAREGIVER", days:9 },
  ],
  "a9f1ca74-032e-465f-b153-54365602c4ca": [
    { cat:"APPETITE", text:"Gopalan only ate half his breakfast. Nausea mentioned.",            sev:"ATTENTION", src:"CAREGIVER", days:1 },
    { cat:"MOBILITY", text:"Mild swelling in ankles. Feet look puffy compared to last week.", sev:"REVIEW",    src:"CAREGIVER", days:2 },
    { cat:"CONFUSION",text:"Slightly disoriented about the day of the week this morning.",     sev:"ATTENTION", src:"CAREGIVER", days:4 },
    { cat:"SLEEP",    text:"Restless night, tossed and turned a lot, probably 4-5 hours.",    sev:"REVIEW",    src:"PATIENT",   days:6 },
    { cat:"MOOD",     text:"Declined to do his usual prayer routine today. Said he's feeling down.", sev:"ATTENTION", src:"CAREGIVER", days:8 },
  ],
  "eaf97dad-41d4-4e48-a345-5f1d3f0f5380": [
    { cat:"MOBILITY", text:"Pitting edema in Lakshmi's ankles. Legs look swollen around calves.",    sev:"REVIEW",    src:"CAREGIVER", days:1 },
    { cat:"SLEEP",    text:"Could not lie flat, needed 3 pillows. Coughing when lying down.",        sev:"REVIEW",    src:"PATIENT",   days:2 },
    { cat:"APPETITE", text:"Appetite good. Ate all meals. Drinking 1.5L fluid as instructed.",      sev:null,        src:"CAREGIVER", days:4 },
    { cat:"MOOD",     text:"Very anxious about upcoming cardiology appointment.",                    sev:"ATTENTION", src:"CAREGIVER", days:5 },
    { cat:"PAIN",     text:"Chest feels heavy when climbing stairs. Had to stop and sit down.",      sev:"REVIEW",    src:"PATIENT",   days:7 },
  ],
  "3489a162-e878-493a-92e3-ad33476afc55": [
    { cat:"MOBILITY", text:"Mohan had significant tremor while eating breakfast. Spilled his tea.", sev:"ATTENTION", src:"CAREGIVER", days:1 },
    { cat:"CONFUSION",text:"Confused about location briefly. Kept asking to go home (was home).",   sev:"REVIEW",    src:"CAREGIVER", days:2 },
    { cat:"MOOD",     text:"Very low mood. Refused to get out of bed until noon.",                  sev:"REVIEW",    src:"CAREGIVER", days:3 },
    { cat:"SLEEP",    text:"Slept 10 hours but still feels exhausted. No energy for daytime.",      sev:"ATTENTION", src:"PATIENT",   days:5 },
    { cat:"APPETITE", text:"Ate well at dinner. Enjoyed his favourite fish curry.",                 sev:null,        src:"CAREGIVER", days:7 },
  ],
  "2275974a-33b5-4f1d-aa97-79b60c26893e": [
    { cat:"SLEEP",    text:"Severe shortness of breath at 2 AM. Had to sit upright for an hour.", sev:"REVIEW",    src:"PATIENT",   days:1 },
    { cat:"MOBILITY", text:"Using walking stick more than usual. SpO2 reading was 91% during activity.", sev:"ATTENTION", src:"CAREGIVER", days:2 },
    { cat:"MOOD",     text:"Very anxious about breathing. Panic attack yesterday.",               sev:"REVIEW",    src:"CAREGIVER", days:4 },
    { cat:"APPETITE", text:"Gets breathless while eating. Has to rest between spoonfuls.",        sev:"ATTENTION", src:"PATIENT",   days:6 },
    { cat:"CONFUSION",text:"Alert and oriented. Able to recall today's news headlines.",          sev:null,        src:"CAREGIVER", days:8 },
  ],
  "5b29040a-ea76-4cf3-9d2c-f63c70fcd419": [
    { cat:"CONFUSION",text:"Did not recognize his daughter-in-law today. Kept asking who she was.", sev:"REVIEW", src:"CAREGIVER", days:1 },
    { cat:"MOBILITY", text:"Found wandering in the garden at 11 PM. No recollection of going outside.", sev:"REVIEW", src:"CAREGIVER", days:3 },
    { cat:"SLEEP",    text:"Sleep-wake cycle reversed, active at night, sleeping most of day.", sev:"ATTENTION", src:"CAREGIVER", days:5 },
    { cat:"MOOD",     text:"Agitated during morning bathing routine. Took 45 minutes to calm him.", sev:"REVIEW", src:"CAREGIVER", days:7 },
    { cat:"APPETITE", text:"Refused breakfast. Accepted small amount of banana mid-morning.", sev:"ATTENTION", src:"CAREGIVER", days:9 },
  ],
  "f400c4b2-e9be-4223-ac3a-342868fd48d6": [
    { cat:"MOBILITY", text:"Significant fatigue after physiotherapy session. Needed to rest for 2 hours.", sev:"ATTENTION", src:"PATIENT", days:1 },
    { cat:"PAIN",     text:"Tingling and numbness in both feet. Described as electric shock sensation.", sev:"REVIEW", src:"PATIENT", days:3 },
    { cat:"SLEEP",    text:"Slept well for 8 hours. No episodes of bladder urgency at night.", sev:null, src:"PATIENT", days:5 },
    { cat:"MOOD",     text:"Positive mood. Participated in online book club with friends.", sev:null, src:"CAREGIVER", days:7 },
    { cat:"APPETITE", text:"Good appetite. Following the recommended diet plan as prescribed.", sev:null, src:"CAREGIVER", days:9 },
  ],
  "95007ae1-f846-4543-9446-5bdf68ddfd32": [
    { cat:"CONFUSION",text:"Balaji had a brief absence seizure at dinner, stared blankly for 30 seconds.", sev:"REVIEW", src:"CAREGIVER", days:1 },
    { cat:"SLEEP",    text:"Slept through the night without incidents. 7 hours total.", sev:null, src:"CAREGIVER", days:3 },
    { cat:"MOOD",     text:"Frustrated about driving restrictions due to epilepsy. Loss of independence.", sev:"ATTENTION", src:"PATIENT", days:5 },
    { cat:"MOBILITY", text:"Moving around well at home. No falls or near-falls this week.", sev:null, src:"CAREGIVER", days:7 },
    { cat:"APPETITE", text:"Ate normally at all three meals. No nausea from medications.", sev:null, src:"CAREGIVER", days:9 },
  ],
  "d47beac5-3a09-4722-94bf-7cae9f8a081f": [
    { cat:"SLEEP",    text:"Padmanabhan sleeping in recliner, cannot breathe lying flat. Has done this for 5 days.", sev:"REVIEW", src:"CAREGIVER", days:1 },
    { cat:"MOOD",     text:"Tearful during conversation with doctor. Expressed fear of hospitalization.", sev:"REVIEW", src:"CAREGIVER", days:2 },
    { cat:"APPETITE", text:"Very poor appetite, half a bowl of rice. No desire to eat.", sev:"ATTENTION", src:"CAREGIVER", days:4 },
    { cat:"MOBILITY", text:"Only walking to the bathroom. Breathless after any exertion.", sev:"REVIEW", src:"CAREGIVER", days:6 },
    { cat:"PAIN",     text:"Chest feels tight most of the day. Nitroglycerin spray used twice this week.", sev:"REVIEW", src:"PATIENT", days:8 },
  ],
  "12d12b80-9848-4130-89ba-10f6334c6899": [
    { cat:"PAIN",     text:"Sharp chest pain with exertion, lasted 5 minutes. Sat down and it resolved.", sev:"REVIEW", src:"PATIENT", days:1 },
    { cat:"MOBILITY", text:"Bilateral lower limb edema graded 2+. Socks leave deep indentations.", sev:"REVIEW", src:"CAREGIVER", days:2 },
    { cat:"SLEEP",    text:"Woke up 4 times overnight. Nighttime breathlessness twice.", sev:"ATTENTION", src:"PATIENT", days:4 },
    { cat:"APPETITE", text:"Nausea with morning medications. Vomited once.", sev:"ATTENTION", src:"CAREGIVER", days:6 },
    { cat:"MOOD",     text:"Crying intermittently. Worried about burdening family.", sev:"ATTENTION", src:"CAREGIVER", days:8 },
  ],
  "a54594c5-bf6f-4f0b-bcca-b3df6ce952c6": [
    { cat:"MOOD",     text:"Venkatasubramanian in excellent spirits. Played chess with grandson and won.", sev:null, src:"CAREGIVER", days:1 },
    { cat:"MOBILITY", text:"Walking around the house independently. 15-minute walk in garden.", sev:null, src:"CAREGIVER", days:3 },
    { cat:"SLEEP",    text:"Slept 7 hours. Pacemaker device showed normal rhythm all night.", sev:null, src:"PATIENT", days:5 },
    { cat:"APPETITE", text:"Ate heartily. Requested second helping of rice and sambar.", sev:null, src:"CAREGIVER", days:7 },
    { cat:"PAIN",     text:"No chest pain. Dizziness resolved since pacemaker implant.", sev:null, src:"PATIENT", days:9 },
  ],
  "ea413a16-5149-4dd9-905b-d3f62508e931": [
    { cat:"MOOD",     text:"Nalini feeling fatigued and brain fog. Difficult to concentrate on tasks.", sev:"ATTENTION", src:"PATIENT", days:1 },
    { cat:"SLEEP",    text:"Sleeping 9-10 hours but still feels unrefreshed. Cold intolerance worsening.", sev:"ATTENTION", src:"PATIENT", days:3 },
    { cat:"APPETITE", text:"Appetite normal. Following low-iodine diet as advised.", sev:null, src:"CAREGIVER", days:5 },
    { cat:"MOBILITY", text:"Mild muscle aches in thighs when climbing stairs.", sev:"ATTENTION", src:"PATIENT", days:7 },
    { cat:"MOOD",     text:"Managing anxiety well overall. Called helpline about thyroid symptoms.", sev:null, src:"CLINICIAN", days:9 },
  ],
  "e442022e-1232-4ccb-b5bc-c6b3bbcc67cb": [
    { cat:"SLEEP",    text:"Shanmugam had a hypoglycaemic episode at 3 AM. Blood sugar 52 mg/dL. Wife gave glucose tablets.", sev:"REVIEW", src:"CAREGIVER", days:1 },
    { cat:"CONFUSION",text:"Slightly confused during the nocturnal hypo episode. Recovered fully after eating.", sev:"ATTENTION", src:"CAREGIVER", days:2 },
    { cat:"APPETITE", text:"Carbohydrate intake on target today. Blood sugars post-meals more stable.", sev:null, src:"PATIENT", days:4 },
    { cat:"MOBILITY", text:"Feet burning at night, diabetic peripheral neuropathy symptom.", sev:"ATTENTION", src:"PATIENT", days:6 },
    { cat:"MOOD",     text:"Frustrated with insulin adjustments. Feels like he cannot get levels stable.", sev:"ATTENTION", src:"CAREGIVER", days:8 },
  ],
  "3a681eb3-f656-48ae-ba48-353c5f0a8a4f": [
    { cat:"MOOD",     text:"Bhagyalakshmi in good spirits. Attended yoga session for 30 minutes.", sev:null, src:"PATIENT", days:1 },
    { cat:"SLEEP",    text:"Joint pain woke her at 5 AM. Managed to get back to sleep after paracetamol.", sev:"ATTENTION", src:"PATIENT", days:3 },
    { cat:"APPETITE", text:"Healthy appetite. Eating calcium-rich foods as recommended.", sev:null, src:"CAREGIVER", days:5 },
    { cat:"MOBILITY", text:"Bone pain in left hip, score 5/10. Had to skip exercise today.", sev:"ATTENTION", src:"PATIENT", days:7 },
    { cat:"CONFUSION",text:"Alert and sharp. Completed crossword puzzle independently.", sev:null, src:"CAREGIVER", days:9 },
  ],
};

type EncRow = { type: string; reason: string; provider: string; location: string; days: number; notes: string };
const ENCOUNTERS: Record<string, EncRow[]> = {
  "66c67bf7-f6e3-478e-b972-20d7d25b4958": [
    { type:"OUTPATIENT", reason:"Quarterly Diabetes Review", provider:"Dr. Arjun Nair", location:"Sunrise Senior Care Centre", days:14, notes:"HbA1c up to 7.8%. Amoxicillin prescribed for dental infection — allergy conflict flagged." },
    { type:"EMERGENCY",  reason:"Chest Pain Evaluation",     provider:"Emergency Physician", location:"Apollo Hospital Emergency", days:45, notes:"Rule out ACS. Troponins negative. Discharged with follow-up." },
    { type:"OUTPATIENT", reason:"Blood Pressure Follow-up",  provider:"Dr. Arjun Nair", location:"Sunrise Senior Care Centre", days:60, notes:"BP controlled at 128/78. Continuing current regimen." },
  ],
  "33ec2506-2cfd-437d-8c66-defd67159f29": [
    { type:"OUTPATIENT", reason:"Rheumatology Review", provider:"Dr. Arjun Nair", location:"Sunrise Senior Care Centre", days:21, notes:"ESR elevated at 62. Dose maintained. LFTs normal. Next review in 3 months." },
    { type:"OUTPATIENT", reason:"DEXA Scan Follow-up", provider:"Dr. Arjun Nair", location:"Bone Density Clinic", days:90, notes:"T-score -2.8, osteoporosis confirmed. Alendronate continued." },
  ],
  "a9f1ca74-032e-465f-b153-54365602c4ca": [
    { type:"OUTPATIENT", reason:"Nephrology Follow-up — CKD Stage 3", provider:"Dr. Arjun Nair", location:"Sunrise Senior Care Centre", days:30, notes:"eGFR stable at 38. Haemoglobin 9.8 — iron supplementation started." },
    { type:"OUTPATIENT", reason:"Geriatric Assessment", provider:"Dr. Arjun Nair", location:"Sunrise Senior Care Centre", days:75, notes:"MMSE 24/30 — mild cognitive concerns. Referral to neurologist." },
  ],
  "eaf97dad-41d4-4e48-a345-5f1d3f0f5380": [
    { type:"OUTPATIENT", reason:"Cardiology Review — Heart Failure", provider:"Dr. Priya Sharma", location:"Sunrise Senior Care Centre", days:12, notes:"BNP 420 pg/mL — elevated. Furosemide dose increased. Weight monitoring daily." },
    { type:"OUTPATIENT", reason:"INR Check and Anticoagulation Review", provider:"Dr. Priya Sharma", location:"Sunrise Senior Care Centre", days:14, notes:"INR 2.3 — therapeutic range. Warfarin dose unchanged." },
    { type:"EMERGENCY",  reason:"Acute Shortness of Breath", provider:"Emergency Physician", location:"Manipal Hospital", days:60, notes:"Acute decompensated HF. IV diuresis, stabilized in 48 hours." },
  ],
  "3489a162-e878-493a-92e3-ad33476afc55": [
    { type:"OUTPATIENT", reason:"Neurology Review — Parkinson's Disease", provider:"Dr. Priya Sharma", location:"Sunrise Senior Care Centre", days:20, notes:"UPDRS score 38. Motor fluctuations increased. Pramipexole dose adjusted." },
    { type:"OUTPATIENT", reason:"Psychiatry Follow-up — Depression", provider:"Dr. Priya Sharma", location:"Sunrise Senior Care Centre", days:28, notes:"PHQ-9 score 14 — moderately severe depression. Sertraline increased to 100mg." },
  ],
  "2275974a-33b5-4f1d-aa97-79b60c26893e": [
    { type:"OUTPATIENT", reason:"Respiratory Review — COPD Management", provider:"Dr. Priya Sharma", location:"Sunrise Senior Care Centre", days:25, notes:"FEV1 55% predicted. Inhaler technique reviewed. Pulmonary rehabilitation referral." },
    { type:"OUTPATIENT", reason:"Anxiety Management Review", provider:"Dr. Priya Sharma", location:"Sunrise Senior Care Centre", days:40, notes:"GAD-7 score 12. Escitalopram continued. CBT referral done." },
  ],
  "5b29040a-ea76-4cf3-9d2c-f63c70fcd419": [
    { type:"OUTPATIENT", reason:"Memory Clinic — Alzheimer's Review", provider:"Dr. Meera Pillai", location:"CareFirst Neurology Clinic", days:18, notes:"MMSE 16/30 — moderate decline from last visit (18). Family counselling provided." },
    { type:"OUTPATIENT", reason:"Diabetes Management", provider:"Dr. Meera Pillai", location:"CareFirst Neurology Clinic", days:45, notes:"HbA1c 8.1%. Metformin dose adjusted. Caregiver educated on hypoglycaemia recognition." },
  ],
  "f400c4b2-e9be-4223-ac3a-342868fd48d6": [
    { type:"OUTPATIENT", reason:"MS Clinic Review", provider:"Dr. Meera Pillai", location:"CareFirst Neurology Clinic", days:35, notes:"No new relapses. Lymphocyte count 0.8 — monitoring closely. MRI scheduled." },
    { type:"OUTPATIENT", reason:"Urology — Bladder Dysfunction Follow-up", provider:"Dr. Meera Pillai", location:"CareFirst Neurology Clinic", days:55, notes:"Bladder diary reviewed. Oxybutynin effective. Urodynamics study pending." },
  ],
  "95007ae1-f846-4543-9446-5bdf68ddfd32": [
    { type:"OUTPATIENT", reason:"Epilepsy Review", provider:"Dr. Meera Pillai", location:"CareFirst Neurology Clinic", days:22, notes:"Last seizure 8 weeks ago. Levetiracetam level 42 mcg/mL (therapeutic)." },
    { type:"OUTPATIENT", reason:"Blood Pressure Follow-up", provider:"Dr. Meera Pillai", location:"CareFirst Neurology Clinic", days:50, notes:"BP 128/80 — controlled. Amlodipine 10mg continued." },
  ],
  "d47beac5-3a09-4722-94bf-7cae9f8a081f": [
    { type:"OUTPATIENT", reason:"Heart Failure Clinic", provider:"Dr. Rajan Menon", location:"HeartCare Hospital", days:10, notes:"BNP 890 pg/mL — markedly elevated. Ramipril and Bisoprolol doses adjusted." },
    { type:"OUTPATIENT", reason:"Cardiology — IHD Management", provider:"Dr. Rajan Menon", location:"HeartCare Hospital", days:30, notes:"Ejection fraction 38% — HFrEF. Echo shows global hypokinesia. Clopidogrel continued." },
    { type:"EMERGENCY",  reason:"Acute Decompensated Heart Failure", provider:"Emergency Physician", location:"HeartCare Hospital", days:90, notes:"IV furosemide administered. Stabilized in 72 hours." },
  ],
  "12d12b80-9848-4130-89ba-10f6334c6899": [
    { type:"OUTPATIENT", reason:"Cardiology — HOCM Review", provider:"Dr. Rajan Menon", location:"HeartCare Hospital", days:15, notes:"Gradient improved on Verapamil. LDL 88 mg/dL — slightly above target." },
    { type:"OUTPATIENT", reason:"Echocardiography Follow-up", provider:"Dr. Rajan Menon", location:"HeartCare Hospital", days:60, notes:"LVOT gradient 42 mmHg at rest. No syncope episodes. Continue Verapamil." },
  ],
  "a54594c5-bf6f-4f0b-bcca-b3df6ce952c6": [
    { type:"OUTPATIENT", reason:"Pacemaker Check", provider:"Dr. Rajan Menon", location:"HeartCare Hospital", days:28, notes:"Device check normal. Battery life 7 years remaining. Pacing 89% of time." },
    { type:"OUTPATIENT", reason:"Annual Cardiology Review", provider:"Dr. Rajan Menon", location:"HeartCare Hospital", days:90, notes:"eGFR 58 — mildly reduced. Aspirin and Atorvastatin continued." },
  ],
  "ea413a16-5149-4dd9-905b-d3f62508e931": [
    { type:"OUTPATIENT", reason:"Endocrinology — Thyroid Review", provider:"Dr. Lakshmi Iyer", location:"Sunrise Senior Care Centre", days:20, notes:"TSH 2.1 — well controlled. Anti-TPO still elevated. Levothyroxine 100mcg continued." },
  ],
  "e442022e-1232-4ccb-b5bc-c6b3bbcc67cb": [
    { type:"OUTPATIENT", reason:"Diabetology — Type 1 DM Review", provider:"Dr. Lakshmi Iyer", location:"Sunrise Senior Care Centre", days:18, notes:"HbA1c 8.9% — suboptimal. Insulin sliding scale adjusted." },
    { type:"OUTPATIENT", reason:"Nephrology — Diabetic Nephropathy", provider:"Dr. Lakshmi Iyer", location:"Sunrise Senior Care Centre", days:45, notes:"eGFR 42 — reduced. ACR 145 mg/g. Lisinopril dose maxed." },
    { type:"OUTPATIENT", reason:"Ophthalmology — Diabetic Retinopathy Screening", provider:"Ophthalmologist", location:"Apollo Eye Centre", days:75, notes:"NPDR — laser photocoagulation recommended. Both eyes affected." },
  ],
  "3a681eb3-f656-48ae-ba48-353c5f0a8a4f": [
    { type:"OUTPATIENT", reason:"Endocrinology — Post-adrenal Adenoma Follow-up", provider:"Dr. Lakshmi Iyer", location:"Sunrise Senior Care Centre", days:30, notes:"24h cortisol normal post-operatively. Hydrocortisone replacement appropriate." },
    { type:"OUTPATIENT", reason:"Bone Density Clinic", provider:"Dr. Lakshmi Iyer", location:"Sunrise Senior Care Centre", days:90, notes:"Alendronate continued. Calcium and Vit D3 supplementation on track." },
  ],
};

type EvRow = { type: string; desc: string; days: number; src: string };
const VALID_TYPES = new Set(["MEDICATION_STARTED","MEDICATION_STOPPED","MEDICATION_CHANGED","MISSED_MEDICATION","FALL","NEAR_FALL","HOSPITALIZATION","ER_VISIT","SYMPTOM","COGNITIVE_CHANGE","FUNCTIONAL_CHANGE","APPETITE_CHANGE","SLEEP_CHANGE","MOBILITY_CHANGE","CAREGIVER_OBSERVATION","LAB_RESULT","PROCEDURE","DIAGNOSIS","ASSESSMENT","MEDICATION_REMINDER","CHECK_IN","CONTACT"]);
const EVENTS: Record<string, EvRow[]> = {
  "66c67bf7-f6e3-478e-b972-20d7d25b4958": [
    { type:"MEDICATION_STARTED", desc:"Amoxicillin 500mg started for dental infection — potential penicillin allergy conflict", days:5, src:"CLINICIAN" },
    { type:"SYMPTOM",            desc:"Hypoglycaemic episode overnight — blood glucose 58 mg/dL at 3 AM",                     days:8, src:"CAREGIVER" },
    { type:"LAB_RESULT",         desc:"HbA1c result: 7.8% — elevated from previous 7.2%",                                     days:14, src:"CLINICIAN" },
    { type:"MEDICATION_CHANGED", desc:"Metformin dose increased from 500mg to 1000mg BD",                                      days:45, src:"CLINICIAN" },
  ],
  "eaf97dad-41d4-4e48-a345-5f1d3f0f5380": [
    { type:"SYMPTOM",            desc:"Bilateral ankle edema — 2+ pitting edema. 2kg weight gain in 5 days.", days:3, src:"CAREGIVER" },
    { type:"MEDICATION_CHANGED", desc:"Furosemide dose increased from 20mg to 40mg daily",                    days:5, src:"CLINICIAN" },
    { type:"LAB_RESULT",         desc:"INR result: 2.3 — therapeutic. Warfarin dose maintained.",              days:14, src:"CLINICIAN" },
    { type:"HOSPITALIZATION",    desc:"Admitted for acute decompensated heart failure. IV diuresis. Discharged after 48h.", days:60, src:"CLINICIAN" },
  ],
  "3489a162-e878-493a-92e3-ad33476afc55": [
    { type:"COGNITIVE_CHANGE",   desc:"Confusional episode in the evening — patient disoriented to place",         days:2, src:"CAREGIVER" },
    { type:"MEDICATION_CHANGED", desc:"Sertraline increased from 50mg to 100mg — depression inadequately controlled", days:7, src:"CLINICIAN" },
    { type:"SYMPTOM",            desc:"Significant tremor affecting meal time — spilled tea twice",               days:1, src:"CAREGIVER" },
    { type:"FALL",               desc:"Near-fall while getting up from sofa. No injury.",                          days:15, src:"CAREGIVER" },
  ],
  "5b29040a-ea76-4cf3-9d2c-f63c70fcd419": [
    { type:"COGNITIVE_CHANGE",   desc:"Failed to recognize daughter-in-law — significant cognitive decline",             days:1, src:"CAREGIVER" },
    { type:"COGNITIVE_CHANGE",   desc:"Wandering episode — found in garden at 11 PM",                                   days:5, src:"CAREGIVER" },
    { type:"LAB_RESULT",         desc:"MMSE: 16/30 — decline from 18 at last review",                                   days:18, src:"CLINICIAN" },
    { type:"SLEEP_CHANGE",       desc:"Sleep-wake reversal developed — awake at night, sleeping through day",            days:10, src:"CAREGIVER" },
    { type:"MEDICATION_CHANGED", desc:"Memantine dose review — increased to 20mg BD for cognitive support",              days:18, src:"CLINICIAN" },
  ],
  "d47beac5-3a09-4722-94bf-7cae9f8a081f": [
    { type:"SYMPTOM",            desc:"Orthopnea worsening — sleeping in recliner for 5 consecutive nights",          days:2, src:"CAREGIVER" },
    { type:"LAB_RESULT",         desc:"BNP: 890 pg/mL — markedly elevated, indicating decompensation",               days:10, src:"CLINICIAN" },
    { type:"MEDICATION_CHANGED", desc:"Ramipril dose titrated up. Bisoprolol adjusted for heart rate control.",        days:10, src:"CLINICIAN" },
    { type:"HOSPITALIZATION",    desc:"Emergency admission for ADHF. IV diuretics. Stabilized over 72 hours.",        days:90, src:"CLINICIAN" },
    { type:"APPETITE_CHANGE",    desc:"Significant appetite loss — eating less than 50% of meals for 4 days",         days:4, src:"CAREGIVER" },
  ],
  "12d12b80-9848-4130-89ba-10f6334c6899": [
    { type:"SYMPTOM",            desc:"Exertional chest pain — 5 minutes, resolved with rest.",                      days:1, src:"PATIENT" },
    { type:"SYMPTOM",            desc:"Bilateral lower limb edema grade 2+ — new onset over 48 hours",               days:1, src:"CAREGIVER" },
    { type:"MEDICATION_CHANGED", desc:"Verapamil dose optimized for HOCM gradient reduction",                        days:15, src:"CLINICIAN" },
  ],
  "e442022e-1232-4ccb-b5bc-c6b3bbcc67cb": [
    { type:"SYMPTOM",            desc:"Nocturnal hypoglycaemia — blood glucose 52 mg/dL at 3 AM. Glucose tablets given.", days:1, src:"CAREGIVER" },
    { type:"LAB_RESULT",         desc:"HbA1c: 8.9% — above target. Insulin regimen needs adjustment.",                   days:18, src:"CLINICIAN" },
    { type:"MEDICATION_CHANGED", desc:"Insulin sliding scale adjusted — basal Glargine reduced by 2 units",               days:5, src:"CLINICIAN" },
    { type:"SYMPTOM",            desc:"Peripheral neuropathy burning pain in feet — nightly, 6/10 severity",               days:3, src:"PATIENT" },
  ],
};

async function main() {
  console.log("=== CareGuardian Full Data Supplemental Seed ===");

  // Encounters
  console.log("\nSeeding encounters...");
  let cnt = 0;
  for (const [pid, encs] of Object.entries(ENCOUNTERS)) {
    for (const e of encs) {
      await prisma.encounter.create({ data: { patientId: pid, providerName: e.provider, type: e.type, reason: e.reason, location: e.location, startedAt: da(e.days), endedAt: new Date(da(e.days).getTime() + 3_600_000), notes: e.notes } });
      cnt++;
    }
  }
  console.log("  " + cnt + " encounters added");

  // Observations
  console.log("\nSeeding observations...");
  cnt = 0;
  for (const [pid, obs] of Object.entries(OBS)) {
    for (const o of obs) {
      const src = o.src === "PATIENT" ? "PATIENT" : o.src === "CLINICIAN" ? "CLINICIAN" : "CAREGIVER";
      await prisma.observation.create({ data: { patientId: pid, sourceType: src as any, category: o.cat as any, rawText: o.text, structured: { category: o.cat }, severity: o.sev, occurredAt: da(o.days), verificationStatus: "REPORTED" } });
      cnt++;
    }
  }
  console.log("  " + cnt + " observations added");

  // Health events
  console.log("\nSeeding health events...");
  cnt = 0;
  for (const [pid, evs] of Object.entries(EVENTS)) {
    for (const ev of evs) {
      if (!VALID_TYPES.has(ev.type)) { console.log("  Skip:" + ev.type); continue; }
      const src = ev.src === "CLINICIAN" ? "CLINICIAN" : ev.src === "PATIENT" ? "PATIENT" : "CAREGIVER";
      await prisma.healthEvent.create({ data: { patientId: pid, type: ev.type as any, timestamp: da(ev.days), sourceType: src as any, description: ev.desc, status: "REPORTED", confidence: 0.88, metadata: {} } });
      cnt++;
    }
  }
  console.log("  " + cnt + " health events added");

  // Baselines
  console.log("\nSeeding baselines...");
  const riskBase: Record<string, number> = { Critical: 55, High: 70, Moderate: 80, Stable: 92 };
  const BL_METRICS = ["COGNITION","MOBILITY","SLEEP","APPETITE","MEDICATION_ADHERENCE","MOOD","BLOOD_PRESSURE"] as const;
  cnt = 0;
  for (const p of PATIENTS) {
    const existing = await prisma.baseline.findUnique({ where: { patientId: p.id } });
    if (existing) continue;
    const base = riskBase[p.risk] ?? 80;
    const bl = await prisma.baseline.create({ data: { patientId: p.id, status: p.risk === "Critical" ? "DECLINING" : p.risk === "High" ? "WATCH" : "STABLE", computedAt: da(7) } });
    for (const m of BL_METRICS) {
      const val = Math.max(30, Math.min(98, base + (Math.random() * 20 - 10)));
      await prisma.baselineMetric.create({ data: { baselineId: bl.id, metric: m, value: Math.round(val), unit: "score", timeWindowDays: 90, sampleSize: Math.floor(Math.random() * 25) + 10, confidence: val > 80 ? "HIGH" : val > 65 ? "MODERATE" : "LOW", sourceCount: Math.floor(Math.random() * 20) + 5 } });
      cnt++;
    }
  }
  console.log("  " + cnt + " baseline metrics added");

  // Missing info
  console.log("\nSeeding missing information...");
  const miByRisk: Record<string, Array<{cat:string;desc:string;sev:string}>> = {
    Critical: [
      { cat:"MEDICATION_RECONCILIATION", desc:"Medication reconciliation overdue — last done 6 months ago.", sev:"CRITICAL" },
      { cat:"FALL_RISK_ASSESSMENT",      desc:"Formal fall risk assessment (Morse Scale) not documented in the past 3 months.", sev:"REVIEW" },
      { cat:"COGNITIVE_ASSESSMENT",      desc:"MMSE or MoCA not completed in the past 6 months.", sev:"REVIEW" },
    ],
    High: [
      { cat:"ANNUAL_WELLNESS",      desc:"Annual wellness visit overdue by 2 months.", sev:"ATTENTION" },
      { cat:"FALL_RISK_ASSESSMENT", desc:"Fall risk Morse Scale last assessed 5 months ago — reassessment due.", sev:"REVIEW" },
    ],
    Moderate: [
      { cat:"ADVANCE_DIRECTIVE", desc:"Advance healthcare directive not on file. Family should be engaged to complete this.", sev:"ATTENTION" },
    ],
    Stable: [
      { cat:"ANNUAL_WELLNESS", desc:"Annual wellness visit to be scheduled — due in 2 months.", sev:"ATTENTION" },
    ],
  };
  cnt = 0;
  for (const p of PATIENTS) {
    const items = (miByRisk[p.risk] || miByRisk["Stable"])!;
    for (const item of items) {
      await prisma.missingInformation.create({ data: { patientId: p.id, category: item.cat as any, description: item.desc, severity: item.sev as any, status: "OPEN" } });
      cnt++;
    }
  }
  console.log("  " + cnt + " missing info items added");

  // Memory facts
  console.log("\nSeeding memory facts...");
  const memFacts = [
    { pid:"66c67bf7-f6e3-478e-b972-20d7d25b4958", type:"FACT", cat:"allergy", content:"CRITICAL: Documented penicillin allergy. Currently prescribed Amoxicillin (penicillin-class). CONFLICT REQUIRES IMMEDIATE REVIEW.", src:"CLINICIAN" },
    { pid:"66c67bf7-f6e3-478e-b972-20d7d25b4958", type:"FACT", cat:"preference", content:"Prefers morning medication schedule. Wife assists with medication management.", src:"CAREGIVER" },
    { pid:"3489a162-e878-493a-92e3-ad33476afc55", type:"FACT", cat:"care_preference", content:"Mohan has expressed a strong desire to remain at home. Has refused nursing home placement.", src:"PATIENT" },
    { pid:"3489a162-e878-493a-92e3-ad33476afc55", type:"OBSERVATION", cat:"pattern", content:"Motor symptoms significantly worse in mornings before Levodopa kicks in. Best window 2-4 PM.", src:"CAREGIVER" },
    { pid:"5b29040a-ea76-4cf3-9d2c-f63c70fcd419", type:"FACT", cat:"safety", content:"Door alarms and GPS tracker in place due to wandering risk. Family has code-locked front door.", src:"CAREGIVER" },
    { pid:"5b29040a-ea76-4cf3-9d2c-f63c70fcd419", type:"OBSERVATION", cat:"trigger", content:"Agitation peaks during bathing. Using music (Tamil devotional songs) as calming tool — effective.", src:"CAREGIVER" },
    { pid:"d47beac5-3a09-4722-94bf-7cae9f8a081f", type:"OBSERVATION", cat:"fluid", content:"Daily weight monitoring in place. Alert threshold: 2kg gain in 24h or 3kg in 3 days.", src:"CLINICIAN" },
    { pid:"eaf97dad-41d4-4e48-a345-5f1d3f0f5380", type:"FACT", cat:"anticoagulation", content:"INR target 2.0-3.0 for AF + HF. Green leafy vegetables restricted. Husband monitors INR with home device.", src:"CLINICIAN" },
    { pid:"eaf97dad-41d4-4e48-a345-5f1d3f0f5380", type:"OBSERVATION", cat:"symptom_pattern", content:"Edema worsens in evenings and heat. Morning weight is most reliable measurement.", src:"CAREGIVER" },
  ];
  cnt = 0;
  for (const f of memFacts) {
    await prisma.healthMemoryFact.create({ data: { patientId: f.pid, memoryType: f.type as any, category: f.cat, content: f.content, provenance: { source: f.src } } });
    cnt++;
  }
  console.log("  " + cnt + " memory facts added");

  console.log("\n All supplemental data seeded successfully!");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
