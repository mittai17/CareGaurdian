'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Clock,
  Heart,
  Pill,
  Activity,
  AlertTriangle,
  Send,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ShiftHandoverPage() {
  const [patientStatus, setPatientStatus] = useState('Stable, alert, oriented x3, resting comfortably');
  const [tasksDone, setTasksDone] = useState('Morning medications administered, bed bath given, dry weight recorded, 15m ambulation');
  const [medsGiven, setMedsGiven] = useState('Furosemide 40mg Oral (08:00 AM), Empagliflozin 10mg Oral (08:00 AM)');
  const [vitalsSummary, setVitalsSummary] = useState('BP 128/82, HR 72, SpO2 97%, Weight 71.6 kg, Fluid Intake 1,200 mL');
  const [newSymptoms, setNewSymptoms] = useState('1+ pitting ankle edema resolving with diuretic; no dyspnea at rest');
  const [observations, setObservations] = useState('Good appetite at lunch (85% eaten). Family member Karthik visited at 11:30 AM.');
  const [nextCaregiver, setNextCaregiver] = useState('Nurse Priya Ramesh (Evening Shift, 03:00 PM – 11:00 PM)');

  const [aiSummaryGenerated, setAiSummaryGenerated] = useState(false);
  const [committed, setCommitted] = useState(false);

  const aiSummary = `AI HANDOVER SUMMARY — 10 Sep 2026, 02:45 PM
Attending: Devaki Sundaram (HFpEF / T2DM)
Outgoing: Sister Mary Joseph, RN • Incoming: Nurse Priya Ramesh

1. Clinical Trajectory: Patient is compensated and stable on day 3 of increased Furosemide titration. Weight is holding at 71.6 kg with reduction in pedal edema.
2. Interventions: All morning cardiorenal doses verified and taken. Fluid restricted to 1.5L ceiling (1.2L consumed).
3. Critical Watch Items for Evening Shift:
   - Administer Spironolactone 25mg with dinner (scheduled 06:00 PM).
   - Re-check orthostatic BP before evening bedtime.
   - Alert Dr. Vikram Malhotra if urine output is < 400 mL during afternoon/evening.`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              Shift Transition Protocol
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Shift End: 03:00 PM
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Clinical Shift Handover & Continuity Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structured continuity transfer ensuring zero missed medications, vital anomalies, or caregiver directives.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href="/nurse">
            <ArrowLeft className="w-4 h-4" /> Back to Care Station
          </Link>
        </Button>
      </div>

      {committed ? (
        <Card className="border-emerald-200 bg-emerald-50/50 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-950">Shift Handover Successfully Committed</h2>
          <p className="text-sm text-emerald-800 max-w-lg mx-auto">
            The continuity summary has been digitally signed and published to incoming Nurse Priya Ramesh and Dr. Vikram Malhotra.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
              <Link href="/nurse">Return to Station</Link>
            </Button>
            <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
              <Printer className="w-4 h-4" /> Print Handover Sheet
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Handover Data Form */}
          <Card>
            <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
              <CardTitle className="text-base">Shift Summary Parameters</CardTitle>
              <CardDescription className="text-xs">
                Review and update before generating the AI Continuity Summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    1. Patient Status
                  </label>
                  <input
                    type="text"
                    value={patientStatus}
                    onChange={(e) => setPatientStatus(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    2. Next Caregiver / Relieving Staff
                  </label>
                  <input
                    type="text"
                    value={nextCaregiver}
                    onChange={(e) => setNextCaregiver(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  3. Tasks Completed During Shift
                </label>
                <textarea
                  rows={2}
                  value={tasksDone}
                  onChange={(e) => setTasksDone(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  4. Medications Given & Times
                </label>
                <textarea
                  rows={2}
                  value={medsGiven}
                  onChange={(e) => setMedsGiven(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    5. Vital Signs Summary
                  </label>
                  <input
                    type="text"
                    value={vitalsSummary}
                    onChange={(e) => setVitalsSummary(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    6. New Symptoms or Red Flags
                  </label>
                  <input
                    type="text"
                    value={newSymptoms}
                    onChange={(e) => setNewSymptoms(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  7. Important Observations & Family Updates
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setAiSummaryGenerated(true)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate AI-Assisted Handover Summary
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Generated Handover Summary Review */}
          {aiSummaryGenerated && (
            <Card className="border-indigo-200 bg-indigo-50/40">
              <CardHeader className="py-4 px-6 border-b border-indigo-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <CardTitle className="text-base text-indigo-950 font-bold">
                    AI Clinical Continuity Summary
                  </CardTitle>
                </div>
                <Badge variant="outline" className="bg-white text-indigo-800 border-indigo-200">
                  Ready for Signing
                </Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-white rounded-xl p-4 border border-indigo-100 text-xs font-mono whitespace-pre-line leading-relaxed text-slate-800 shadow-inner">
                  {aiSummary}
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Non-Diagnostic Clinical Support: AI synthesizes observations for physician and relieving nurse review. Clinical decisions remain the sole responsibility of licensed caregivers.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Signing as: <span className="font-semibold text-slate-900">Sister Mary Joseph (Verified Nurse)</span>
                  </p>
                  <Button
                    onClick={() => setCommitted(true)}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Sign & Dispatch Handover
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
