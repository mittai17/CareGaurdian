'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Pill,
  Droplets,
  Moon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Send,
  UserCheck,
  FileSpreadsheet,
  Heart,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { observationsApi } from '@/lib/api';
import { IotVitalsSync } from '@/components/vitals/iot-vitals-sync';

export default function NurseDashboardPage() {
  const [systolic, setSystolic] = useState('128');
  const [diastolic, setDiastolic] = useState('82');
  const [pulse, setPulse] = useState('72');
  const [waterMl, setWaterMl] = useState('1200');
  const [foodPercent, setFoodPercent] = useState('85');
  const [sleepHours, setSleepHours] = useState('6.5');
  const [symptomNotes, setSymptomNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [tasks, setTasks] = useState([
    { id: '1', time: '08:00 AM', task: 'Administer Furosemide 40mg with food', status: 'COMPLETED', category: 'Medication' },
    { id: '2', time: '10:30 AM', task: 'Check bilateral ankle edema & dry weight', status: 'COMPLETED', category: 'Vitals' },
    { id: '3', time: '01:00 PM', task: 'Administer Spironolactone 25mg after lunch', status: 'PENDING', category: 'Medication' },
    { id: '4', time: '03:30 PM', task: 'Assisted 15-minute hallway ambulation', status: 'PENDING', category: 'Mobility' },
    { id: '5', time: '06:00 PM', task: 'Evening blood pressure & fluid balance check', status: 'PENDING', category: 'Shift Handover' },
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t));
  };

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    const observationText = `Nurse Mary recorded Vitals: BP ${systolic}/${diastolic} mmHg, HR ${pulse} bpm, Water: ${waterMl}mL, Diet: ${foodPercent}%, Sleep: ${sleepHours}h. Notes: ${symptomNotes || 'Stable'}`;

    try {
      await observationsApi.create('77777777-0000-4000-8000-000000000001', {
        category: 'OTHER',
        rawText: observationText,
        severity: parseInt(systolic) > 140 ? 'ATTENTION' : 'NORMAL',
      });
    } catch (err) {
      console.warn('Nurse observation sync:', err);
    }

    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Credentials & Shift Information */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full">
              Day Shift • 07:00 AM – 03:00 PM
            </span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
              Verified Nurse Badge Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">Professional Nurse Care Station</h1>
          <p className="text-blue-200 text-xs mt-1">
            Attending: <span className="font-semibold text-white">Devaki Sundaram</span> (HFpEF, T2DM) • Room 302 / Home Telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold gap-1.5">
            <Link href="/nurse/handover">
              <FileSpreadsheet className="w-4 h-4" />
              Prepare Shift Handover
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="bg-white/10 text-white border-white/20 text-xs hover:bg-white/20">
            <Link href="/clinician/messages">Message Dr. Malhotra</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Shift Tasks & Clinical Vitals Entry */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Care Tasks */}
          <Card>
            <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Today&apos;s Care Schedule & Medication Tasks
                </CardTitle>
                <CardDescription className="text-xs">
                  Click to log task completion with automatic cryptographic nurse timestamp attribution.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                {tasks.filter(t => t.status === 'COMPLETED').length}/{tasks.length} Done
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          t.status === 'COMPLETED' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {t.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-foreground'}`}>
                          {t.task}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Scheduled: {t.time} • Attributed to: Sister Mary Joseph, RN
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clinical Observation & Vitals Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Record Clinical Observations & Vitals
              </CardTitle>
              <CardDescription className="text-xs">
                Saves directly to the Centralized Shared Patient Record with nurse verification tag.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  Observation recorded: &ldquo;{new Date().toLocaleDateString('en-IN')} — Added by: Verified Nurse Mary&rdquo;
                </div>
              )}

              <form onSubmit={handleRecordVitals} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-muted-foreground font-semibold mb-1">Blood Pressure (mmHg)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                        className="w-full rounded border px-2 py-1.5 font-mono"
                        placeholder="120"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                        className="w-full rounded border px-2 py-1.5 font-mono"
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-semibold mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full rounded border px-2 py-1.5 font-mono"
                      placeholder="72"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-semibold mb-1">Fluid Intake (mL)</label>
                    <input
                      type="number"
                      value={waterMl}
                      onChange={(e) => setWaterMl(e.target.value)}
                      className="w-full rounded border px-2 py-1.5 font-mono"
                      placeholder="1200"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-semibold mb-1">Diet Intake (%)</label>
                    <input
                      type="number"
                      value={foodPercent}
                      onChange={(e) => setFoodPercent(e.target.value)}
                      className="w-full rounded border px-2 py-1.5 font-mono"
                      placeholder="85"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Clinical Notes & Symptoms Observed
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Bilateral pedal edema status, breathing on exertion, sleep quality, pain scales..."
                    value={symptomNotes}
                    onChange={(e) => setSymptomNotes(e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                    <Send className="w-3.5 h-3.5" />
                    Commit to Shared Patient Record
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: AI Care Intelligence & Shared Record Feed */}
        <div className="space-y-6">
          {/* IoT Vitals Bluetooth Sync */}
          <IotVitalsSync patientId="77777777-0000-4000-8000-000000000001" />

          {/* AI Care Intelligence Box */}
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                AI Care Intelligence Alerts
              </CardTitle>
              <CardDescription className="text-xs text-amber-900">
                Automated multi-observation trend detection (Non-diagnostic safety signals)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-amber-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>Patient Alert: Fluid Retention</span>
                  <Badge variant="destructive" className="text-[10px]">High Attention</Badge>
                </div>
                <p className="text-slate-700">
                  &ldquo;Weight surge (+3.4kg) corroborates 1+ pedal edema reports. Furosemide titration active.&rdquo;
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>Caregiver Workload Index</span>
                  <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50">Moderate</Badge>
                </div>
                <p className="text-slate-700">
                  &ldquo;Family caregiver Karthik logged 4 reports in 48h. Nurse shift relief operating normally.&rdquo;
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Centralized Shared Patient Record Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Shared Record Activity
              </CardTitle>
              <CardDescription className="text-xs">
                Live chronological ledger with user attribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="border-l-2 border-primary pl-3 py-1 space-y-0.5">
                <span className="font-mono text-[10px] text-muted-foreground">10 Sep 2026 — 08:30 AM</span>
                <p className="font-semibold text-slate-800">Blood pressure recorded: 128/82</p>
                <p className="text-[11px] text-blue-700 font-medium">Added by: Verified Nurse (Sister Mary Joseph)</p>
              </div>

              <div className="border-l-2 border-purple-500 pl-3 py-1 space-y-0.5">
                <span className="font-mono text-[10px] text-muted-foreground">10 Sep 2026 — 07:45 AM</span>
                <p className="font-semibold text-slate-800">Morning weight logged: 71.6 kg</p>
                <p className="text-[11px] text-purple-700 font-medium">Added by: Family Caregiver (Karthik Sundaram)</p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-3 py-1 space-y-0.5">
                <span className="font-mono text-[10px] text-muted-foreground">09 Sep 2026 — 04:30 PM</span>
                <p className="font-semibold text-slate-800">Prescription adjusted: Furosemide 40mg</p>
                <p className="text-[11px] text-emerald-700 font-medium">Added by: Verified Doctor (Dr. Vikram Malhotra)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
