'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, User, Clock, Stethoscope, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';

interface ClinicalNote {
  id: string;
  date: string;
  author: string;
  authorRole: string;
  type: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  signed: boolean;
}

const PATIENT_NOTES: Record<string, ClinicalNote[]> = {
  '66c67bf7-f6e3-478e-b972-20d7d25b4958': [
    { id:'n1', date:'2026-09-08T10:30:00Z', author:'Dr. Arjun Nair', authorRole:'General Physician', type:'Quarterly Diabetes Review', signed:true,
      subjective:'Ravi Kumar reports he has been checking his blood sugars daily. Wife Nalini states he sometimes skips medications. He developed a dental infection 2 weeks ago and was started on Amoxicillin by the dentist. CRITICAL: Ravi has a known penicillin allergy (rash reaction documented). Amoxicillin is a penicillin-class antibiotic.',
      objective:'BP: 132/82 mmHg. Weight: 72.1 kg. HbA1c 7.8% (up from 7.2%). FPG: 148 mg/dL. Dental abscess partially resolved. No acute allergic reaction noted currently.',
      assessment:'Suboptimally controlled T2DM. Hypertension well controlled. ALLERGY CONFLICT: Amoxicillin prescribed against documented penicillin allergy — requires urgent review.',
      plan:'1. URGENT: Discontinue Amoxicillin. Refer to dentist for alternative antibiotic (Azithromycin). Document allergy conflict in EHR.\n2. Increase Metformin from 500mg to 1000mg BD.\n3. Caregiver education on medication adherence tracking.\n4. Repeat HbA1c in 3 months.' },
    { id:'n2', date:'2026-07-15T09:00:00Z', author:'Dr. Arjun Nair', authorRole:'General Physician', type:'Blood Pressure Follow-up', signed:true,
      subjective:'Patient well. No chest pain or headaches. Compliant with Lisinopril.',
      objective:'BP: 128/78 mmHg bilaterally. HR: 72 bpm. Peripheral pulses normal.',
      assessment:'Hypertension well controlled on current regimen.',
      plan:'Continue Lisinopril 10mg once daily. Dietary sodium restriction advised. Review in 3 months.' },
  ],
  '33ec2506-2cfd-437d-8c66-defd67159f29': [
    { id:'n1', date:'2026-09-05T11:00:00Z', author:'Dr. Arjun Nair', authorRole:'General Physician', type:'Rheumatology Review', signed:true,
      subjective:'Sunita Balasubramanian reports increased bilateral hand joint pain, rating 7/10. Morning stiffness lasting >1 hour. Functional limitation noted in grip and fine motor tasks.',
      objective:'Swollen MCP and PIP joints bilaterally. ESR: 62 mm/hr. CRP: 12.4 mg/L. LFTs normal. Methotrexate level adequate.',
      assessment:'Rheumatoid Arthritis — active disease with elevated inflammatory markers. Osteoporosis stable on Alendronate.',
      plan:'1. Continue Methotrexate 15mg weekly. Add folic acid 5mg on non-MTX day.\n2. Physiotherapy referral for hand exercises.\n3. Review with rheumatologist in 6 weeks if no improvement.\n4. Monitor LFTs monthly.' },
  ],
  'a9f1ca74-032e-465f-b153-54365602c4ca': [
    { id:'n1', date:'2026-09-01T09:30:00Z', author:'Dr. Arjun Nair', authorRole:'General Physician', type:'Nephrology Follow-up — CKD Stage 3', signed:true,
      subjective:'Gopalan Rajan reports reduced appetite and mild nausea for 4 days. Caregiver reports ankle swelling.',
      objective:'BP: 142/86 mmHg. eGFR: 38 mL/min/1.73m². Creatinine: 1.68 mg/dL. Haemoglobin: 9.8 g/dL (iron deficiency component). Bilateral ankle edema 1+.',
      assessment:'CKD Stage 3 — stable eGFR but mild anaemia of CKD. Hypertension slightly above target.',
      plan:'1. Start iron supplementation: Ferrous sulphate 200mg BD with Vitamin C.\n2. Refer to dietitian for CKD-adapted low-protein diet.\n3. Increase Amlodipine to 10mg for BP control.\n4. Repeat eGFR and FBC in 6 weeks.' },
  ],
  'eaf97dad-41d4-4e48-a345-5f1d3f0f5380': [
    { id:'n1', date:'2026-09-03T10:00:00Z', author:'Dr. Priya Sharma', authorRole:'Cardiologist', type:'Cardiology Review — Heart Failure + Atrial Fibrillation', signed:true,
      subjective:'Lakshmi Raghavan reports worsening breathlessness on mild exertion over the past week. Husband notes 2kg weight gain in 5 days. Cannot lie flat — uses 3 pillows. Ankles visibly swollen.',
      objective:'BP: 118/74 mmHg. HR: 82 bpm (irregularly irregular). SpO2: 94%. BNP: 420 pg/mL (up from 280). 2+ pitting edema ankles. INR: 2.3 (therapeutic). ECG: AF with rate 82.',
      assessment:'Atrial Fibrillation + Decompensating Heart Failure. BNP rising — early volume overload. Hypothyroidism may be contributing to AF control difficulty.',
      plan:'1. Increase Furosemide from 20mg to 40mg for 7 days, then reassess.\n2. Daily weight monitoring — alert if >2kg gain in 24h.\n3. Restrict fluid to 1.5L/day.\n4. Repeat BNP in 2 weeks.\n5. TFTs to reassess thyroid control.' },
  ],
  '3489a162-e878-493a-92e3-ad33476afc55': [
    { id:'n1', date:'2026-09-01T14:00:00Z', author:'Dr. Priya Sharma', authorRole:'Neurologist', type:'Neurology Review — Parkinson\'s Disease + Depression', signed:true,
      subjective:'Mohan Pillai\'s son reports significant motor fluctuations — severe morning off-periods and improved function in early afternoons. PHQ-9 score 14 (moderately severe depression). Refuses social activities.',
      objective:'UPDRS motor score: 38. Postural tremor 2/4 bilaterally. Bradykinesia 3/4. Mild festinating gait. Cognition: MMSE 24/30.',
      assessment:'Moderate Parkinson\'s disease with motor fluctuations. Moderately severe depression, likely exacerbated by loss of independence and social isolation.',
      plan:'1. Adjust Levodopa/Carbidopa timing — give 30 min before meals to improve absorption.\n2. Increase Sertraline from 50mg to 100mg — monitor for serotonin syndrome.\n3. Referral to Parkinson\'s physiotherapy group.\n4. Discuss DBS candidacy at next neurosurgery MDT.' },
  ],
  '2275974a-33b5-4f1d-aa97-79b60c26893e': [
    { id:'n1', date:'2026-08-28T11:00:00Z', author:'Dr. Priya Sharma', authorRole:'Respiratory Physician', type:'COPD Review', signed:true,
      subjective:'Kamala Venkatesh reports nocturnal breathlessness 3-4 nights per week. Using rescue inhaler 5-6 times per week. Anxiety worsening, with 2 panic attacks last month.',
      objective:'FEV1: 55% predicted. FEV1/FVC ratio: 0.62. SpO2: 92% on exertion. CXR: hyperinflated lungs, no consolidation. GAD-7: 12 (moderate anxiety).',
      assessment:'COPD GOLD Stage II. Anxiety disorder exacerbating perceived breathlessness and leading to over-use of rescue inhaler.',
      plan:'1. Add Tiotropium 18mcg once daily via HandiHaler.\n2. Refer to pulmonary rehabilitation programme.\n3. Breathing retraining with physiotherapist for anxiety-related dyspnoea.\n4. Continue Escitalopram — increase to 15mg.' },
  ],
  '5b29040a-ea76-4cf3-9d2c-f63c70fcd419': [
    { id:'n1', date:'2026-09-05T09:00:00Z', author:'Dr. Meera Pillai', authorRole:'Geriatric Psychiatrist', type:'Memory Clinic Review — Alzheimer\'s Disease', signed:true,
      subjective:'Family reports Krishnamurthy Swaminathan no longer recognizes daughter-in-law. Wandering at night on 3 occasions in past 2 weeks. Refusing bathing — agitation during personal care.',
      objective:'MMSE: 16/30 (down from 18 at last visit, 3 months ago). Clock drawing: unable to complete. Significant decline in IADLs. BSL: 162 mg/dL.',
      assessment:'Moderate Alzheimer\'s Disease with increasing behavioral disturbance. T2DM suboptimally controlled — likely affected by dietary inconsistency due to cognitive decline.',
      plan:'1. Increase Memantine to 20mg BD.\n2. Refer family to memory care support group.\n3. Occupational therapy home assessment for safety.\n4. Consider nighttime melatonin for sleep-wake reversal.\n5. Caregiver respite services referral.' },
  ],
  'f400c4b2-e9be-4223-ac3a-342868fd48d6': [
    { id:'n1', date:'2026-09-05T10:00:00Z', author:'Dr. Meera Pillai', authorRole:'Neurologist', type:'MS Clinic Review', signed:true,
      subjective:'Radha Krishnan reports no new relapses in past 6 months. However, fatigue is increasingly limiting her ADLs. Bladder urgency improved on Oxybutynin.',
      objective:'EDSS: 3.5. Lymphocyte count: 0.8 (monitoring threshold). MRI: no new lesions cf. baseline. PVR: 35mL (improved).',
      assessment:'RRMS — stable disease activity on Dimethyl Fumarate (DMF). Fatigue prominent. Bladder dysfunction improving.',
      plan:'1. Continue DMF 240mg BD — monitor lymphocytes every 3 months.\n2. Refer to MS fatigue management programme.\n3. Continue Oxybutynin 5mg BD — review in 3 months.\n4. MRI brain and spine in 12 months.' },
  ],
  '95007ae1-f846-4543-9446-5bdf68ddfd32': [
    { id:'n1', date:'2026-09-03T11:00:00Z', author:'Dr. Meera Pillai', authorRole:'Neurologist', type:'Epilepsy Review', signed:true,
      subjective:'Balaji Subramaniam reports 1 absence seizure 8 weeks ago — stared blankly for ~30 seconds while eating dinner. No tonic-clonic events. Wife witnessed it.',
      objective:'Levetiracetam level: 42 mcg/mL (therapeutic range 12-46). BP: 128/80. Neurology exam: normal. EEG: mild generalised slowing.',
      assessment:'Focal epilepsy — adequately controlled on Levetiracetam. Hypertension well controlled on Amlodipine.',
      plan:'1. Continue Levetiracetam 1g BD — do not adjust dose.\n2. Remind patient of driving restriction — legally must be seizure-free for 12 months.\n3. Advise annual EEG monitoring.\n4. Refer to social worker re: impact of driving restriction on independence.' },
  ],
  'd47beac5-3a09-4722-94bf-7cae9f8a081f': [
    { id:'n1', date:'2026-09-05T09:30:00Z', author:'Dr. Rajan Menon', authorRole:'Cardiologist', type:'Heart Failure Clinic — Critical Review', signed:true,
      subjective:'Padmanabhan Nambiar\'s wife reports he has been sleeping in a recliner for 5 nights (orthopnea), with severe appetite loss. He is breathless walking to the bathroom.',
      objective:'Weight: 71.4 kg (3.1 kg above dry weight). BNP: 890 pg/mL (markedly elevated). BP: 102/64 mmHg. HR: 92 bpm. SpO2: 91% on room air. Bilateral crackles in lung bases. 3+ pitting edema.',
      assessment:'Acutely decompensated congestive heart failure — significant fluid overload. eGFR 42 — cardiorenal syndrome developing.',
      plan:'1. URGENT: Consider hospital admission if not improving within 48h.\n2. IV Furosemide 40mg if available via home care nurse.\n3. Ramipril dose titrated up to 5mg BD.\n4. Daily weight — if >2kg gain in 24h, admit immediately.\n5. Cardiology review in 5 days.' },
  ],
  '12d12b80-9848-4130-89ba-10f6334c6899': [
    { id:'n1', date:'2026-09-01T10:00:00Z', author:'Dr. Rajan Menon', authorRole:'Cardiologist', type:'HOCM Review', signed:true,
      subjective:'Janaki Srinivasan reports chest pain on exertion (5 min, resolving with rest). New onset bilateral leg swelling. Nausea with morning medications.',
      objective:'LVOT gradient: 42 mmHg at rest. LDL: 88 mg/dL. NT-proBNP: 380 pg/mL. Echo: asymmetric septal hypertrophy. BP: 108/72 mmHg. HR: 66 bpm.',
      assessment:'Hypertrophic Obstructive Cardiomyopathy (HOCM) — stable gradient. Dyslipidaemia partially controlled. New peripheral edema requires monitoring.',
      plan:'1. Continue Verapamil 120mg TDS — review dose if gradient persists.\n2. Increase Rosuvastatin from 10mg to 20mg for LDL target.\n3. Prescribe Domperidone 10mg before meals for nausea.\n4. Repeat Echo in 6 months.' },
  ],
  'a54594c5-bf6f-4f0b-bcca-b3df6ce952c6': [
    { id:'n1', date:'2026-09-01T14:00:00Z', author:'Dr. Rajan Menon', authorRole:'Cardiologist', type:'Pacemaker Check + Annual Review', signed:true,
      subjective:'Venkatasubramanian Iyer reports feeling well. No palpitations, syncope, or presyncope. Active at home, walking in garden daily.',
      objective:'Device interrogation: Battery 7 years remaining. Pacing 89% of time. No arrhythmias logged. Sensing thresholds normal. BP: 122/74 mmHg. eGFR: 58.',
      assessment:'Complete heart block — well managed with dual-chamber pacemaker. Device functioning optimally. Mild CKD stable.',
      plan:'1. Continue Aspirin 75mg and Atorvastatin 20mg.\n2. Next pacemaker check in 6 months.\n3. Recheck eGFR and lipids in 3 months.\n4. Patient encouraged to continue mild physical activity.' },
  ],
  'ea413a16-5149-4dd9-905b-d3f62508e931': [
    { id:'n1', date:'2026-09-04T10:00:00Z', author:'Dr. Lakshmi Iyer', authorRole:'Endocrinologist', type:'Thyroid Management Review', signed:true,
      subjective:'Nalini Chandrasekhar reports persistent fatigue, brain fog, and cold intolerance despite levothyroxine therapy. Sleeping 9-10 hours but still unrefreshed.',
      objective:'TSH: 2.1 mIU/L (within range). Free T4: 1.2 ng/dL. Anti-TPO: 245 IU/mL (elevated — active Hashimoto\'s). Weight 63 kg (unchanged).',
      assessment:'Hashimoto\'s thyroiditis with hypothyroidism — biochemically euthyroid but symptomatic. Some patients feel better with TSH in lower-normal range.',
      plan:'1. Increase Levothyroxine from 100mcg to 112.5mcg (alternate 100/125mcg daily).\n2. Recheck TFTs in 6 weeks.\n3. Selenium supplementation 200mcg daily — may reduce anti-TPO titres.\n4. Consider referral to endocrinology if symptoms persist.' },
  ],
  'e442022e-1232-4ccb-b5bc-c6b3bbcc67cb': [
    { id:'n1', date:'2026-09-02T11:00:00Z', author:'Dr. Lakshmi Iyer', authorRole:'Endocrinologist', type:'Diabetology Review — Type 1 DM', signed:true,
      subjective:'Shanmugam Palanichamy reports frequent nocturnal hypoglycaemia. Last episode: blood glucose 52 mg/dL at 3 AM. Wife administered glucose tablets. Peripheral neuropathy causing foot burning at night.',
      objective:'HbA1c: 8.9% (suboptimal). eGFR: 42 (declining). ACR: 145 mg/g (macroalbuminuria). Fundal exam: NPDR bilateral. Weight: 58 kg.',
      assessment:'T1DM with suboptimal control. Diabetic nephropathy (stage 3a). NPDR bilateral. Peripheral neuropathy. High risk of progression to ESRD without tight BP and glycaemic control.',
      plan:'1. Reduce basal Glargine by 2 units to prevent nocturnal hypos.\n2. Discuss CGM (continuous glucose monitor) use.\n3. Ophthalmology: expedite laser photocoagulation referral.\n4. Increase Lisinopril to maximum dose.\n5. Refer to nephrology urgently.' },
  ],
  '3a681eb3-f656-48ae-ba48-353c5f0a8a4f': [
    { id:'n1', date:'2026-09-01T14:00:00Z', author:'Dr. Lakshmi Iyer', authorRole:'Endocrinologist', type:'Post-op Adrenal Adenoma Follow-up', signed:true,
      subjective:'Bhagyalakshmi Narayanan reports doing well post-adrenalectomy. Mild hip pain — bone density concern. Following hydrocortisone replacement schedule reliably.',
      objective:'24h urinary cortisol: 48 mcg (slightly above upper limit). DEXA T-score Hip: -2.5 (osteoporosis). Vitamin D: 38 ng/mL (adequate). Fasting glucose: 104 mg/dL.',
      assessment:'Cushing\'s syndrome in remission — mild hypercortisolism may indicate residual tissue or stress response. Secondary osteoporosis from chronic cortisol exposure.',
      plan:'1. Repeat 24h urinary cortisol in 6 weeks.\n2. Continue Alendronate 70mg weekly for osteoporosis.\n3. Calcium 1000mg + Vitamin D3 1000 IU daily.\n4. Repeat DEXA in 12 months.\n5. Continue Hydrocortisone 15/10/5mg (morning/noon/evening).' },
  ],
};

const GENERIC_NOTES: ClinicalNote[] = [
  { id:'gn1', date:'2026-09-01T10:00:00Z', author:'Assigned Clinician', authorRole:'General Physician', type:'Routine Follow-up', signed:true,
    subjective:'Patient attended for routine follow-up. Reports feeling generally stable with no new acute symptoms.',
    objective:'Vital signs stable. Weight unchanged from last visit. No focal abnormalities on examination.',
    assessment:'Chronic conditions stable. Medication adherence reported as good.',
    plan:'Continue current medications. Review in 3 months. Bloods to be repeated prior to next review.' },
];

export default function PatientNotesPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Note Form
  const [newType, setNewType] = useState('Follow-up Encounter');
  const [newSubj, setNewSubj] = useState('');
  const [newObj, setNewObj] = useState('');
  const [newAssess, setNewAssess] = useState('');
  const [newPlan, setNewPlan] = useState('');

  const [notes, setNotes] = useState<ClinicalNote[]>(() => {
    return PATIENT_NOTES[patientId] ?? GENERIC_NOTES;
  });

  useEffect(() => {
    // Reset notes when patient changes
    setNotes(PATIENT_NOTES[patientId] ?? GENERIC_NOTES);
  }, [patientId]);

  useEffect(() => {
    async function load() {
      try {
        const res = await patientsApi.getById(patientId);
        setPatient(res?.data || res || null);
      } catch (e) {
        console.error('Failed to load patient:', e);
        setPatient(MOCK_PATIENTS_MAP[patientId] ?? null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ClinicalNote = {
      id: 'note-' + Date.now(),
      date: new Date().toISOString(),
      author: 'Dr. Vikram Malhotra',
      authorRole: 'Attending Physician',
      type: newType,
      subjective: newSubj,
      objective: newObj,
      assessment: newAssess,
      plan: newPlan,
      signed: true,
    };
    setNotes([created, ...notes]);
    setShowAddForm(false);
    setNewSubj('');
    setNewObj('');
    setNewAssess('');
    setNewPlan('');
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) {
    return <div className="p-8 text-center text-muted-foreground">Patient not found.</div>;
  }

  return (
    <div>
      <PatientHeader patient={patient} />
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Clinical Notes & Encounters
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Structured SOAP notes, physician encounter summaries, and longitudinal clinical commentary.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancel' : 'New Clinical Note'}
          </Button>
        </div>

        {/* Add Note Modal/Form */}
        {showAddForm && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base text-primary flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Draft New SOAP Note
              </CardTitle>
              <CardDescription>
                Note will be cryptographically signed and added to the patient&apos;s longitudinal EHR memory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Encounter Type
                  </label>
                  <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      (S) Subjective
                    </label>
                    <textarea
                      rows={3}
                      value={newSubj}
                      onChange={(e) => setNewSubj(e.target.value)}
                      placeholder="Patient's reported symptoms, caregiver input..."
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      (O) Objective
                    </label>
                    <textarea
                      rows={3}
                      value={newObj}
                      onChange={(e) => setNewObj(e.target.value)}
                      placeholder="Vitals, physical exam findings, telemetry data..."
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      (A) Assessment
                    </label>
                    <textarea
                      rows={3}
                      value={newAssess}
                      onChange={(e) => setNewAssess(e.target.value)}
                      placeholder="Differential diagnosis, clinical impression..."
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      (P) Plan
                    </label>
                    <textarea
                      rows={3}
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value)}
                      placeholder="Medications adjusted, diagnostic orders, follow-up..."
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button type="submit" className="gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Sign & Commit Note
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Existing Notes List */}
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="border shadow-sm">
              <CardHeader className="py-4 px-6 border-b bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-semibold text-primary border-primary/30">
                      {note.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(note.date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Signed by <span className="font-medium text-foreground">{note.author}</span> ({note.authorRole})
                  </p>
                </div>
                {note.signed && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Digitally Verified
                  </span>
                )}
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Subjective</h4>
                  <p className="text-slate-800 leading-relaxed">{note.subjective}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Objective</h4>
                  <p className="text-slate-800 leading-relaxed font-mono text-xs bg-slate-50 p-2.5 rounded border">
                    {note.objective}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Assessment</h4>
                  <p className="text-slate-800 leading-relaxed">{note.assessment}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Plan</h4>
                  <div className="text-slate-800 leading-relaxed whitespace-pre-line bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    {note.plan}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
