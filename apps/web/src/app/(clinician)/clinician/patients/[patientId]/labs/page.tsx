'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi, labsApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, FlaskConical, Calendar, Minus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Per-patient mock labs when none found in DB
import { MOCK_LABS } from '@/lib/mock-patient-details';

const PATIENT_LABS: Record<string, any[]> = {
  '77777777-0000-4000-8000-000000000001': MOCK_LABS,
  '66c67bf7-f6e3-478e-b972-20d7d25b4958': [
    { id:'r1', testName:'HbA1c', category:'Glycemic Control', value:'7.8', unit:'%', refRange:'< 5.7', flag:'HIGH', collectedAt:'2026-09-02', trend:'up' },
    { id:'r2', testName:'Fasting Plasma Glucose', category:'Glycemic Control', value:'148', unit:'mg/dL', refRange:'70-99', flag:'HIGH', collectedAt:'2026-09-02', trend:'up' },
    { id:'r3', testName:'Serum Creatinine', category:'Renal Function', value:'0.97', unit:'mg/dL', refRange:'0.6-1.1', flag:'NORMAL', collectedAt:'2026-09-02', trend:'flat' },
    { id:'r4', testName:'LDL Cholesterol', category:'Lipid Panel', value:'112', unit:'mg/dL', refRange:'< 100', flag:'HIGH', collectedAt:'2026-08-15', trend:'up' },
    { id:'r5', testName:'Potassium (Serum)', category:'Electrolytes', value:'4.1', unit:'mEq/L', refRange:'3.5-5.0', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
  ],
  '33ec2506-2cfd-437d-8c66-defd67159f29': [
    { id:'r1', testName:'ESR (Erythrocyte Sedimentation Rate)', category:'Inflammatory Markers', value:'62', unit:'mm/hr', refRange:'0-20', flag:'HIGH', collectedAt:'2026-09-05', trend:'up' },
    { id:'r2', testName:'CRP (C-Reactive Protein)', category:'Inflammatory Markers', value:'12.4', unit:'mg/L', refRange:'< 5', flag:'HIGH', collectedAt:'2026-09-05', trend:'up' },
    { id:'r3', testName:'ALT (Liver Function)', category:'Liver Function', value:'28', unit:'U/L', refRange:'7-40', flag:'NORMAL', collectedAt:'2026-09-05', trend:'flat' },
    { id:'r4', testName:'DEXA T-Score (Spine)', category:'Bone Density', value:'-2.8', unit:'SD', refRange:'>-1.0', flag:'LOW', collectedAt:'2026-07-20', trend:'down' },
    { id:'r5', testName:'Serum Calcium', category:'Electrolytes', value:'9.2', unit:'mg/dL', refRange:'8.5-10.5', flag:'NORMAL', collectedAt:'2026-09-05', trend:'flat' },
  ],
  'a9f1ca74-032e-465f-b153-54365602c4ca': [
    { id:'r1', testName:'eGFR (CKD-EPI)', category:'Renal Function', value:'38', unit:'mL/min/1.73m²', refRange:'> 60', flag:'LOW', collectedAt:'2026-09-01', trend:'down' },
    { id:'r2', testName:'Serum Creatinine', category:'Renal Function', value:'1.68', unit:'mg/dL', refRange:'0.6-1.1', flag:'HIGH', collectedAt:'2026-09-01', trend:'up' },
    { id:'r3', testName:'Hemoglobin', category:'Complete Blood Count', value:'9.8', unit:'g/dL', refRange:'12-17', flag:'LOW', collectedAt:'2026-09-01', trend:'down' },
    { id:'r4', testName:'Urine ACR (Albumin:Creatinine)', category:'Renal Function', value:'89', unit:'mg/g', refRange:'< 30', flag:'HIGH', collectedAt:'2026-09-01', trend:'up' },
    { id:'r5', testName:'Serum Potassium', category:'Electrolytes', value:'4.8', unit:'mEq/L', refRange:'3.5-5.0', flag:'NORMAL', collectedAt:'2026-09-01', trend:'flat' },
  ],
  'eaf97dad-41d4-4e48-a345-5f1d3f0f5380': [
    { id:'r1', testName:'BNP (B-type Natriuretic Peptide)', category:'Cardiac Biomarkers', value:'420', unit:'pg/mL', refRange:'< 100', flag:'CRITICAL', collectedAt:'2026-09-03', trend:'up' },
    { id:'r2', testName:'INR', category:'Coagulation', value:'2.3', unit:'ratio', refRange:'2.0-3.0', flag:'NORMAL', collectedAt:'2026-09-03', trend:'flat' },
    { id:'r3', testName:'TSH (Thyroid Stimulating Hormone)', category:'Thyroid', value:'8.1', unit:'mIU/L', refRange:'0.4-4.0', flag:'HIGH', collectedAt:'2026-09-03', trend:'up' },
    { id:'r4', testName:'Serum Potassium', category:'Electrolytes', value:'3.2', unit:'mEq/L', refRange:'3.5-5.0', flag:'LOW', collectedAt:'2026-09-03', trend:'down' },
    { id:'r5', testName:'eGFR', category:'Renal Function', value:'58', unit:'mL/min/1.73m²', refRange:'> 60', flag:'LOW', collectedAt:'2026-09-03', trend:'flat' },
  ],
  '3489a162-e878-493a-92e3-ad33476afc55': [
    { id:'r1', testName:'Levodopa Serum Level', category:'Drug Levels', value:'0.8', unit:'mcg/mL', refRange:'0.5-1.5', flag:'NORMAL', collectedAt:'2026-09-01', trend:'flat' },
    { id:'r2', testName:'Serum Ferritin', category:'Iron Studies', value:'18', unit:'ng/mL', refRange:'24-336', flag:'LOW', collectedAt:'2026-09-01', trend:'down' },
    { id:'r3', testName:'Vitamin B12', category:'Vitamins', value:'188', unit:'pg/mL', refRange:'200-900', flag:'LOW', collectedAt:'2026-08-15', trend:'down' },
    { id:'r4', testName:'TSH', category:'Thyroid', value:'2.8', unit:'mIU/L', refRange:'0.4-4.0', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
    { id:'r5', testName:'HbA1c', category:'Glycemic Control', value:'5.6', unit:'%', refRange:'< 5.7', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
  ],
  '2275974a-33b5-4f1d-aa97-79b60c26893e': [
    { id:'r1', testName:'FEV1 (Pulmonary Function)', category:'Respiratory', value:'55', unit:'% predicted', refRange:'> 80%', flag:'LOW', collectedAt:'2026-08-28', trend:'down' },
    { id:'r2', testName:'Arterial Blood Gas — pO2', category:'Respiratory', value:'68', unit:'mmHg', refRange:'75-100', flag:'LOW', collectedAt:'2026-08-28', trend:'down' },
    { id:'r3', testName:'SpO2 (Resting)', category:'Respiratory', value:'93', unit:'%', refRange:'> 95%', flag:'LOW', collectedAt:'2026-08-28', trend:'down' },
    { id:'r4', testName:'CRP', category:'Inflammatory Markers', value:'8.1', unit:'mg/L', refRange:'< 5', flag:'HIGH', collectedAt:'2026-08-28', trend:'up' },
    { id:'r5', testName:'Eosinophil Count', category:'Complete Blood Count', value:'0.4', unit:'x10^9/L', refRange:'0.04-0.4', flag:'NORMAL', collectedAt:'2026-08-28', trend:'flat' },
  ],
  '5b29040a-ea76-4cf3-9d2c-f63c70fcd419': [
    { id:'r1', testName:'MMSE Score', category:'Cognitive Assessment', value:'16', unit:'/30', refRange:'> 24', flag:'LOW', collectedAt:'2026-09-05', trend:'down' },
    { id:'r2', testName:'HbA1c', category:'Glycemic Control', value:'8.1', unit:'%', refRange:'< 5.7', flag:'HIGH', collectedAt:'2026-09-05', trend:'up' },
    { id:'r3', testName:'Serum Folate', category:'Vitamins', value:'2.4', unit:'ng/mL', refRange:'2.7-17', flag:'LOW', collectedAt:'2026-08-15', trend:'down' },
    { id:'r4', testName:'Vitamin D', category:'Vitamins', value:'18', unit:'ng/mL', refRange:'30-80', flag:'LOW', collectedAt:'2026-08-15', trend:'down' },
    { id:'r5', testName:'TSH', category:'Thyroid', value:'3.2', unit:'mIU/L', refRange:'0.4-4.0', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
  ],
  'f400c4b2-e9be-4223-ac3a-342868fd48d6': [
    { id:'r1', testName:'MRI Brain (Lesion Load)', category:'Neuroimaging', value:'Moderate', unit:'', refRange:'Stable', flag:'HIGH', collectedAt:'2026-08-01', trend:'up' },
    { id:'r2', testName:'Lymphocyte Count', category:'Complete Blood Count', value:'0.8', unit:'x10^9/L', refRange:'1.0-4.8', flag:'LOW', collectedAt:'2026-09-05', trend:'down' },
    { id:'r3', testName:'Vitamin D', category:'Vitamins', value:'22', unit:'ng/mL', refRange:'30-80', flag:'LOW', collectedAt:'2026-09-05', trend:'down' },
    { id:'r4', testName:'Urinalysis — WBC', category:'Urology', value:'10', unit:'/hpf', refRange:'< 5', flag:'HIGH', collectedAt:'2026-09-05', trend:'up' },
    { id:'r5', testName:'HbA1c', category:'Glycemic Control', value:'5.4', unit:'%', refRange:'< 5.7', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
  ],
  '95007ae1-f846-4543-9446-5bdf68ddfd32': [
    { id:'r1', testName:'Levetiracetam Level', category:'Drug Levels', value:'42', unit:'mcg/mL', refRange:'12-46', flag:'NORMAL', collectedAt:'2026-09-03', trend:'flat' },
    { id:'r2', testName:'Serum Sodium', category:'Electrolytes', value:'134', unit:'mEq/L', refRange:'135-145', flag:'LOW', collectedAt:'2026-09-03', trend:'down' },
    { id:'r3', testName:'Serum ALT', category:'Liver Function', value:'32', unit:'U/L', refRange:'7-40', flag:'NORMAL', collectedAt:'2026-09-03', trend:'flat' },
    { id:'r4', testName:'Fasting Glucose', category:'Glycemic Control', value:'98', unit:'mg/dL', refRange:'70-99', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
    { id:'r5', testName:'Complete Blood Count — WBC', category:'Complete Blood Count', value:'7.2', unit:'x10^9/L', refRange:'4-10', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
  ],
  'd47beac5-3a09-4722-94bf-7cae9f8a081f': [
    { id:'r1', testName:'BNP (B-type Natriuretic Peptide)', category:'Cardiac Biomarkers', value:'890', unit:'pg/mL', refRange:'< 100', flag:'CRITICAL', collectedAt:'2026-09-05', trend:'up' },
    { id:'r2', testName:'eGFR', category:'Renal Function', value:'42', unit:'mL/min/1.73m²', refRange:'> 60', flag:'LOW', collectedAt:'2026-09-05', trend:'down' },
    { id:'r3', testName:'HbA1c', category:'Glycemic Control', value:'8.6', unit:'%', refRange:'< 5.7', flag:'HIGH', collectedAt:'2026-09-01', trend:'up' },
    { id:'r4', testName:'Ejection Fraction (Echo)', category:'Cardiac Function', value:'38', unit:'%', refRange:'> 55', flag:'LOW', collectedAt:'2026-08-28', trend:'down' },
    { id:'r5', testName:'Troponin I', category:'Cardiac Biomarkers', value:'0.04', unit:'ng/mL', refRange:'< 0.04', flag:'NORMAL', collectedAt:'2026-09-05', trend:'flat' },
  ],
  '12d12b80-9848-4130-89ba-10f6334c6899': [
    { id:'r1', testName:'LVOT Gradient (Echo)', category:'Cardiac Function', value:'42', unit:'mmHg', refRange:'< 30', flag:'HIGH', collectedAt:'2026-09-01', trend:'flat' },
    { id:'r2', testName:'LDL Cholesterol', category:'Lipid Panel', value:'88', unit:'mg/dL', refRange:'< 70 (high risk)', flag:'HIGH', collectedAt:'2026-09-01', trend:'down' },
    { id:'r3', testName:'NT-proBNP', category:'Cardiac Biomarkers', value:'380', unit:'pg/mL', refRange:'< 125', flag:'HIGH', collectedAt:'2026-09-01', trend:'up' },
    { id:'r4', testName:'Serum Potassium', category:'Electrolytes', value:'3.8', unit:'mEq/L', refRange:'3.5-5.0', flag:'NORMAL', collectedAt:'2026-09-01', trend:'flat' },
    { id:'r5', testName:'Haemoglobin', category:'Complete Blood Count', value:'11.4', unit:'g/dL', refRange:'12-17', flag:'LOW', collectedAt:'2026-09-01', trend:'down' },
  ],
  'a54594c5-bf6f-4f0b-bcca-b3df6ce952c6': [
    { id:'r1', testName:'Pacemaker Battery Life', category:'Device Check', value:'7 yr', unit:'remaining', refRange:'> 2 yr', flag:'NORMAL', collectedAt:'2026-09-01', trend:'flat' },
    { id:'r2', testName:'eGFR', category:'Renal Function', value:'58', unit:'mL/min/1.73m²', refRange:'> 60', flag:'LOW', collectedAt:'2026-09-01', trend:'flat' },
    { id:'r3', testName:'LDL Cholesterol', category:'Lipid Panel', value:'82', unit:'mg/dL', refRange:'< 100', flag:'NORMAL', collectedAt:'2026-08-15', trend:'down' },
    { id:'r4', testName:'TSH', category:'Thyroid', value:'2.4', unit:'mIU/L', refRange:'0.4-4.0', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
    { id:'r5', testName:'Haemoglobin', category:'Complete Blood Count', value:'13.2', unit:'g/dL', refRange:'12-17', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
  ],
  'ea413a16-5149-4dd9-905b-d3f62508e931': [
    { id:'r1', testName:'TSH (Thyroid Stimulating Hormone)', category:'Thyroid', value:'2.1', unit:'mIU/L', refRange:'0.4-4.0', flag:'NORMAL', collectedAt:'2026-09-04', trend:'down' },
    { id:'r2', testName:'Free T4', category:'Thyroid', value:'1.2', unit:'ng/dL', refRange:'0.8-1.8', flag:'NORMAL', collectedAt:'2026-09-04', trend:'flat' },
    { id:'r3', testName:'Anti-TPO Antibodies', category:'Thyroid', value:'245', unit:'IU/mL', refRange:'< 34', flag:'HIGH', collectedAt:'2026-09-04', trend:'flat' },
    { id:'r4', testName:'Serum Calcium', category:'Electrolytes', value:'9.0', unit:'mg/dL', refRange:'8.5-10.5', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
    { id:'r5', testName:'HbA1c', category:'Glycemic Control', value:'5.5', unit:'%', refRange:'< 5.7', flag:'NORMAL', collectedAt:'2026-08-15', trend:'flat' },
  ],
  'e442022e-1232-4ccb-b5bc-c6b3bbcc67cb': [
    { id:'r1', testName:'HbA1c', category:'Glycemic Control', value:'8.9', unit:'%', refRange:'< 5.7', flag:'HIGH', collectedAt:'2026-09-02', trend:'up' },
    { id:'r2', testName:'eGFR', category:'Renal Function', value:'42', unit:'mL/min/1.73m²', refRange:'> 60', flag:'LOW', collectedAt:'2026-09-02', trend:'down' },
    { id:'r3', testName:'Urine ACR (Albumin:Creatinine)', category:'Renal Function', value:'145', unit:'mg/g', refRange:'< 30', flag:'HIGH', collectedAt:'2026-09-02', trend:'up' },
    { id:'r4', testName:'Serum Creatinine', category:'Renal Function', value:'1.54', unit:'mg/dL', refRange:'0.6-1.1', flag:'HIGH', collectedAt:'2026-09-02', trend:'up' },
    { id:'r5', testName:'Fasting Plasma Glucose', category:'Glycemic Control', value:'210', unit:'mg/dL', refRange:'70-99', flag:'CRITICAL', collectedAt:'2026-09-02', trend:'up' },
  ],
  '3a681eb3-f656-48ae-ba48-353c5f0a8a4f': [
    { id:'r1', testName:'24h Urinary Cortisol', category:'Adrenal Function', value:'48', unit:'mcg/24h', refRange:'3.5-45', flag:'HIGH', collectedAt:'2026-09-01', trend:'down' },
    { id:'r2', testName:'DEXA T-Score (Hip)', category:'Bone Density', value:'-2.5', unit:'SD', refRange:'> -1.0', flag:'LOW', collectedAt:'2026-07-01', trend:'flat' },
    { id:'r3', testName:'Serum Calcium', category:'Electrolytes', value:'9.4', unit:'mg/dL', refRange:'8.5-10.5', flag:'NORMAL', collectedAt:'2026-09-01', trend:'flat' },
    { id:'r4', testName:'Vitamin D', category:'Vitamins', value:'38', unit:'ng/mL', refRange:'30-80', flag:'NORMAL', collectedAt:'2026-09-01', trend:'up' },
    { id:'r5', testName:'Fasting Glucose', category:'Glycemic Control', value:'104', unit:'mg/dL', refRange:'70-99', flag:'HIGH', collectedAt:'2026-09-01', trend:'flat' },
  ],
};

export default function PatientLabsPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<any>(null);
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [patRes, labsRes] = await Promise.all([
          patientsApi.getById(patientId).catch(() => null),
          labsApi.list(patientId).catch(() => []),
        ]);
        const pt = patRes?.data || patRes || MOCK_PATIENTS_MAP[patientId] || null;
        setPatient(pt);

        const dbLabs: any[] = Array.isArray(labsRes) ? labsRes : (labsRes as any)?.labResults ?? [];
        // Use DB labs if present, otherwise fallback to per-patient mock
        const fallbackLabs = PATIENT_LABS[patientId] ?? [];
        setLabs(dbLabs.length > 0 ? dbLabs : fallbackLabs);
      } catch (e) {
        console.error('Failed to load labs:', e);
        setPatient(MOCK_PATIENTS_MAP[patientId] ?? null);
        setLabs(PATIENT_LABS[patientId] ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) return <div className="p-8 text-center text-muted-foreground">Patient not found.</div>;

  // Normalize DB vs mock lab shapes
  const normalized = labs.map((lab: any) => ({
    id: lab.id,
    testName: lab.testName ?? lab.name ?? 'Lab Test',
    category: lab.category ?? lab.testType ?? 'General',
    value: lab.value ?? lab.result ?? '—',
    unit: lab.unit ?? '',
    refRange: lab.referenceRange ?? lab.refRange ?? '—',
    flag: lab.flag ?? lab.interpretation ?? (lab.status === 'critical' ? 'CRITICAL' : lab.status === 'high' ? 'HIGH' : lab.status === 'low' ? 'LOW' : 'NORMAL'),
    date: lab.collectedAt ?? lab.date ?? lab.createdAt ?? '',
    trend: lab.trend ?? 'flat',
  }));

  const criticals = normalized.filter(l => l.flag === 'CRITICAL');
  const latest = normalized.length > 0 ? normalized[0].date : null;

  function flagBadge(flag: string) {
    if (flag === 'CRITICAL') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 animate-pulse">
        <AlertTriangle className="w-3 h-3" /> Critical
      </span>
    );
    if (flag === 'HIGH') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <TrendingUp className="w-3 h-3" /> High
      </span>
    );
    if (flag === 'LOW') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
        <TrendingDown className="w-3 h-3" /> Low
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Normal
      </span>
    );
  }

  return (
    <div>
      <PatientHeader patient={patient} />
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-primary" />
              Diagnostic Laboratories &amp; Biomarkers
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {normalized.length} laboratory results for {patient.firstName} {patient.lastName}.
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <FlaskConical className="w-4 h-4" />
            Order Lab Panel
          </Button>
        </div>

        {/* Critical alerts */}
        {criticals.map((c) => (
          <div key={c.id} className="rounded-xl border border-red-200 bg-red-50/70 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-red-900">Critical Anomaly: {c.testName} ({c.value} {c.unit})</span>
              <p className="text-red-800 text-xs mt-0.5">
                Value is significantly outside reference range ({c.refRange}). Requires immediate clinical attention.
              </p>
            </div>
          </div>
        ))}

        {/* Lab Results Table */}
        {normalized.length === 0 ? (
          <Card>
            <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No lab results recorded yet.</p>
              <p className="text-sm mt-1">Lab results will appear here as they are reported.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Biomarker Panels</CardTitle>
              {latest && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Latest sample: {formatDate(latest)}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/50 text-xs text-muted-foreground uppercase">
                    <th className="text-left py-3 px-6 font-semibold">Test Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Value</th>
                    <th className="text-left py-3 px-4 font-semibold">Reference Range</th>
                    <th className="text-left py-3 px-4 font-semibold">Trend</th>
                    <th className="text-right py-3 px-6 font-semibold">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {normalized.map((lab) => (
                    <tr key={lab.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-foreground">{lab.testName}</td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">{lab.category}</td>
                      <td className="py-3.5 px-4 font-bold font-mono">
                        {lab.value} <span className="text-xs font-normal text-muted-foreground">{lab.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">{lab.refRange} {lab.unit}</td>
                      <td className="py-3.5 px-4">
                        {lab.trend === 'up' && <TrendingUp className="w-4 h-4 text-rose-500" />}
                        {lab.trend === 'down' && <TrendingDown className="w-4 h-4 text-blue-500" />}
                        {lab.trend === 'flat' && <Minus className="w-4 h-4 text-muted-foreground" />}
                      </td>
                      <td className="py-3.5 px-6 text-right">{flagBadge(lab.flag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
