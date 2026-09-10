'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Pill,
  Calendar,
  PhoneCall,
  AlertOctagon,
  Heart,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Volume2,
  Stethoscope,
  Smile,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { observationsApi } from '@/lib/api';

export default function PatientDashboardPage() {
  const [sosTriggered, setSosTriggered] = useState(false);
  const [meds, setMeds] = useState([
    { id: '1', name: 'Furosemide', dose: '40mg (Morning)', time: '8:00 AM', detail: 'Take with half glass of water after breakfast', taken: true },
    { id: '2', name: 'Empagliflozin', dose: '10mg (Morning)', time: '8:00 AM', detail: 'Heart & glucose protection tablet', taken: true },
    { id: '3', name: 'Spironolactone', dose: '25mg (Lunch)', time: '1:00 PM', detail: 'Take with food to protect kidney balance', taken: false },
  ]);

  const [todayMood, setTodayMood] = useState<'Good' | 'Fair' | 'Not Well'>('Good');

  const toggleMed = (id: string) => {
    setMeds(meds.map(m => {
      if (m.id === id) {
        const nextTaken = !m.taken;
        if ('speechSynthesis' in window && nextTaken) {
          const u = new SpeechSynthesisUtterance(`${m.name} marked as taken. Good job!`);
          window.speechSynthesis.speak(u);
        }
        return { ...m, taken: nextTaken };
      }
      return m;
    }));
  };

  const handleTriggerSOS = async () => {
    setSosTriggered(true);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("Emergency alert dispatched to Dr. Malhotra and your son Karthik. Help is on the way.");
      window.speechSynthesis.speak(u);
    }
    try {
      await observationsApi.create('77777777-0000-4000-8000-000000000001', {
        category: 'OTHER',
        rawText: 'CRITICAL EMERGENCY SOS TRIGGERED BY PATIENT DEVAKI SUNDARAM',
        severity: 'CRITICAL',
      });
    } catch (e) {
      console.warn('SOS alert sync:', e);
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* Huge Emergency Banner / SOS Button */}
      <section id="emergency" className="scroll-mt-24">
        {sosTriggered ? (
          <div className="rounded-3xl border-4 border-red-600 bg-red-100 p-6 md:p-8 text-center space-y-3 animate-pulse">
            <ShieldAlert className="w-16 h-16 text-red-600 mx-auto" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-red-950">
              EMERGENCY ALERT SENT
            </h2>
            <p className="text-lg font-bold text-red-900">
              Dr. Vikram Malhotra and your son Karthik have been paged.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Button asChild size="lg" className="bg-red-700 hover:bg-red-800 text-white font-bold h-14 px-8 text-lg rounded-2xl">
                <a href="tel:108">
                  <PhoneCall className="w-6 h-6 mr-2" />
                  Call Ambulance (108)
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSosTriggered(false)}
                className="h-14 px-6 text-base font-bold rounded-2xl border-2 border-red-400"
              >
                Cancel Alert
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border-4 border-red-500 bg-red-50/90 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-red-700 bg-red-200 px-3 py-1 rounded-full">
                Instant Emergency Help
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-red-950 mt-1">
                Feeling Dizzy or Unwell?
              </h2>
              <p className="text-base font-medium text-red-900 mt-1">
                Press the big red button below to alert your doctor and family immediately.
              </p>
            </div>

            <Button
              onClick={handleTriggerSOS}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xl md:text-2xl h-16 md:h-20 px-8 md:px-12 rounded-2xl shadow-lg flex items-center gap-3 w-full md:w-auto justify-center"
            >
              <AlertOctagon className="w-8 h-8" />
              EMERGENCY HELP (SOS)
            </Button>
          </div>
        )}
      </section>

      {/* Greeting Card with High Contrast */}
      <div className="rounded-3xl bg-emerald-800 text-white p-6 md:p-8 shadow-md">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-200">
          Personal Health Home
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-1">
          Good day, Devaki
        </h1>
        <p className="text-lg text-emerald-100 mt-2 max-w-2xl leading-relaxed">
          You are doing well today. Your heart recovery plan is active under <span className="text-white font-bold underline">Dr. Vikram Malhotra</span>.
        </p>

        {/* Quick Health Status Mood check */}
        <div className="mt-6 pt-4 border-t border-emerald-700 flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-emerald-200">How do you feel right now?</span>
          {(['Good', 'Fair', 'Not Well'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setTodayMood(m)}
              className={`px-4 py-2 rounded-xl text-base font-bold transition-transform ${
                todayMood === m
                  ? 'bg-white text-emerald-950 scale-105 shadow'
                  : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              {m === 'Good' && '😊 Good'}
              {m === 'Fair' && '😐 Fair'}
              {m === 'Not Well' && '😔 Not Well'}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Section */}
      <section id="medicines" className="scroll-mt-24 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-950 flex items-center gap-3">
              <Pill className="w-8 h-8 text-emerald-700" />
              Today&apos;s Medicines
            </h2>
            <p className="text-base text-slate-600 font-medium">
              Tap any medicine to check it off after you swallow it.
            </p>
          </div>
          <span className="text-lg font-bold bg-emerald-100 text-emerald-900 px-4 py-1.5 rounded-full border border-emerald-300">
            {meds.filter(m => m.taken).length} of {meds.length} Taken
          </span>
        </div>

        <div className="space-y-4">
          {meds.map((med) => (
            <div
              key={med.id}
              onClick={() => toggleMed(med.id)}
              className={`p-6 rounded-3xl border-3 transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                med.taken
                  ? 'bg-emerald-50/70 border-emerald-500 opacity-90'
                  : 'bg-white border-slate-300 hover:border-emerald-600'
              }`}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-colors ${
                    med.taken ? 'bg-emerald-600 border-emerald-700 text-white' : 'border-slate-400 bg-white'
                  }`}
                >
                  {med.taken && <CheckCircle2 className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className={`text-xl md:text-2xl font-bold ${med.taken ? 'line-through text-slate-500' : 'text-slate-950'}`}>
                    {med.name} — {med.dose}
                  </h3>
                  <p className="text-sm md:text-base font-semibold text-slate-600 mt-1">
                    {med.detail}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base md:text-lg font-bold bg-slate-100 text-slate-800 px-4 py-2 rounded-xl border border-slate-200">
                  {med.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appointments & Care Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Appointment */}
        <Card id="appointments" className="scroll-mt-24 border-2 border-slate-300 rounded-3xl p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2.5 text-slate-950">
              <Calendar className="w-6 h-6 text-primary" />
              Next Doctor Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
              <p className="text-lg font-black text-blue-950">Tuesday, 15 Sep 2026 at 10:30 AM</p>
              <p className="text-base font-semibold text-blue-900 mt-1">
                Dr. Vikram Malhotra (Cardiothoracic Clinic)
              </p>
              <p className="text-sm text-blue-800 mt-1">
                Heart failure follow-up & routine ECG check.
              </p>
            </div>
            <Button size="lg" asChild className="w-full h-14 text-base font-bold rounded-2xl bg-blue-700 hover:bg-blue-800">
              <Link href="/clinician/messages">
                <MessageSquare className="w-5 h-5 mr-2" />
                Ask Doctor a Question
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Caregiver Information */}
        <Card id="caregiver" className="scroll-mt-24 border-2 border-slate-300 rounded-3xl p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2.5 text-slate-950">
              <Heart className="w-6 h-6 text-rose-600" />
              My Caregivers on Duty
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                    RN
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-950">Sister Mary Joseph</h4>
                    <p className="text-xs text-blue-700 font-semibold">Verified Nurse (Day Shift)</p>
                  </div>
                </div>
                <a href="tel:+919840011223" className="text-sm font-bold text-blue-700 hover:underline">
                  Call Nurse
                </a>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center">
                    KS
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-950">Karthik Sundaram</h4>
                    <p className="text-xs text-purple-700 font-semibold">Son & Daily Caregiver</p>
                  </div>
                </div>
                <a href="tel:+919840123456" className="text-sm font-bold text-purple-700 hover:underline">
                  Call Son
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
