'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, FlaskConical, Calendar } from 'lucide-react';

interface LabItem {
  id: string;
  testName: string;
  category: string;
  value: string;
  unit: string;
  range: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  date: string;
  trend: 'up' | 'down' | 'flat';
}

export default function PatientLabsPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const labs: LabItem[] = [
    { id: '1', testName: 'NT-proBNP (B-type Natriuretic Peptide)', category: 'Cardiac Biomarkers', value: '1,420', unit: 'pg/mL', range: '< 300', status: 'critical', date: '2026-09-02', trend: 'up' },
    { id: '2', testName: 'Serum Creatinine', category: 'Renal Function', value: '1.24', unit: 'mg/dL', range: '0.6 - 1.1', status: 'high', date: '2026-09-02', trend: 'up' },
    { id: '3', testName: 'eGFR (CKD-EPI)', category: 'Renal Function', value: '54', unit: 'mL/min/1.73m²', range: '> 60', status: 'low', date: '2026-09-02', trend: 'down' },
    { id: '4', testName: 'Potassium (Serum)', category: 'Electrolytes', value: '4.6', unit: 'mEq/L', range: '3.5 - 5.0', status: 'normal', date: '2026-09-02', trend: 'flat' },
    { id: '5', testName: 'Sodium (Serum)', category: 'Electrolytes', value: '136', unit: 'mEq/L', range: '135 - 145', status: 'normal', date: '2026-09-02', trend: 'flat' },
    { id: '6', testName: 'Hemoglobin A1c', category: 'Glycemic Control', value: '7.2', unit: '%', range: '< 5.7', status: 'high', date: '2026-08-15', trend: 'down' },
    { id: '7', testName: 'Fasting Plasma Glucose', category: 'Glycemic Control', value: '138', unit: 'mg/dL', range: '70 - 99', status: 'high', date: '2026-08-15', trend: 'up' },
    { id: '8', testName: 'Total Cholesterol', category: 'Lipid Panel', value: '174', unit: 'mg/dL', range: '< 200', status: 'normal', date: '2026-08-15', trend: 'down' },
  ];

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) return <div className="p-8 text-center text-muted-foreground">Patient not found.</div>;

  return (
    <div>
      <PatientHeader patient={patient} />
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-primary" />
              Diagnostic Laboratories & Biomarkers
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Longitudinal tracking of cardiac biomarkers, renal panels, electrolytes, and glycemic indices.
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <FlaskConical className="w-4 h-4" />
            Order Lab Panel
          </Button>
        </div>

        {/* Alert Summary Box */}
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold text-red-900">Critical Anomaly: NT-proBNP Surge (1,420 pg/mL)</span>
            <p className="text-red-800 text-xs mt-0.5">
              Reflects acute left ventricular wall stress, strongly corroborating caregiver Karthik&apos;s report of rapid 3.4kg weight gain and pedal edema.
            </p>
          </div>
        </div>

        {/* Lab Results Table */}
        <Card>
          <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Biomarker Panels</CardTitle>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Latest sample: 02 Sep 2026
            </span>
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
                {labs.map((lab) => {
                  let badge = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Normal
                    </span>
                  );
                  if (lab.status === 'critical') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Critical
                      </span>
                    );
                  } else if (lab.status === 'high') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <TrendingUp className="w-3 h-3" /> High
                      </span>
                    );
                  } else if (lab.status === 'low') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        <TrendingDown className="w-3 h-3" /> Low
                      </span>
                    );
                  }

                  return (
                    <tr key={lab.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-foreground">{lab.testName}</td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">{lab.category}</td>
                      <td className="py-3.5 px-4 font-bold font-mono">
                        {lab.value} <span className="text-xs font-normal text-muted-foreground">{lab.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">{lab.range} {lab.unit}</td>
                      <td className="py-3.5 px-4">
                        {lab.trend === 'up' && <TrendingUp className="w-4 h-4 text-rose-500" />}
                        {lab.trend === 'down' && <TrendingDown className="w-4 h-4 text-blue-500" />}
                        {lab.trend === 'flat' && <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3.5 px-6 text-right">{badge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
