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
  MessageSquare,
  Volume2,
  ShieldAlert,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { observationsApi } from '@/lib/api';

// ─── Per-card speak helper ────────────────────────────────────────────────────
function speakText(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88;
    window.speechSynthesis.speak(u);
  }
}

// ─── SpeakerButton ───────────────────────────────────────────────────────────
function SpeakerButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); speakText(text); }}
      aria-label={`Read ${label} aloud`}
      title={`Read ${label} aloud`}
      className="ml-2 p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
    >
      <Volume2 className="w-6 h-6" />
    </button>
  );
}

// ─── Cognitive-decline stage: "early" | "mid" | "late" | "none"
// In a real app this would come from the patient profile API.
const PATIENT_STAGE: 'none' | 'early' | 'mid' | 'late' = 'none';

export default function PatientDashboardPage() {
  const [sosTriggered, setSosTriggered] = useState(false);
  const [meds, setMeds] = useState([
    { id: '1', name: 'Furosemide', dose: '40 mg (Morning)', time: '8:00 AM', detail: 'Take with half glass of water after breakfast', taken: true },
    { id: '2', name: 'Empagliflozin', dose: '10 mg (Morning)', time: '8:00 AM', detail: 'Heart & glucose protection tablet', taken: true },
    { id: '3', name: 'Spironolactone', dose: '25 mg (Lunch)', time: '1:00 PM', detail: 'Take with food to protect kidney balance', taken: false },
  ]);

  const [todayMood, setTodayMood] = useState<'Good' | 'Fair' | 'Not Well'>('Good');

  // Mid/late cognitive decline → simplified 3-element view
  const simplifiedMode = PATIENT_STAGE === 'mid' || PATIENT_STAGE === 'late';

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
    speakText("Emergency alert dispatched to Dr. Malhotra and your son Karthik. Help is on the way.");
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

  // ─── Simplified Mode (mid/late cognitive decline) ──────────────────────────
  if (simplifiedMode) {
    return (
      <div className="space-y-8 text-slate-900">
        {/* SOS */}
        <section id="emergency">
          {sosTriggered ? (
            <div className="rounded-3xl border-4 border-red-600 bg-red-100 p-8 text-center space-y-4 animate-pulse">
              <ShieldAlert className="w-20 h-20 text-red-600 mx-auto" />
              <h2 className="text-4xl font-extrabold text-red-950">EMERGENCY ALERT SENT</h2>
              <p className="text-2xl font-bold text-red-900">Dr. Vikram Malhotra and your son Karthik have been paged.</p>
              <div className="pt-2 flex justify-center gap-4">
                <Button asChild size="lg" className="bg-red-700 hover:bg-red-800 text-white font-black text-xl h-20 px-10 rounded-2xl">
                  <a href="tel:108"><PhoneCall className="w-7 h-7 mr-2" />Call Ambulance (108)</a>
                </Button>
                <Button variant="outline" size="lg" onClick={() => setSosTriggered(false)} className="h-20 px-8 text-xl font-black rounded-2xl border-2 border-red-400">Cancel Alert</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleTriggerSOS}
              className="w-full rounded-3xl border-4 border-red-500 bg-red-50 p-8 flex flex-col items-center justify-center gap-4 shadow-md active:scale-95 transition-transform"
            >
              <AlertOctagon className="w-20 h-20 text-red-600" />
              <span className="font-black text-4xl text-red-900">EMERGENCY HELP (SOS)</span>
              <span className="text-xl font-bold text-red-800">Press if you feel dizzy, unwell, or in danger</span>
            </button>
          )}
        </section>

        {/* Today's Medicines */}
        <section id="medicines" className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black text-slate-950 flex items-center gap-3">
              <Pill className="w-10 h-10 text-primary" />
              Today&apos;s Medicines
            </h2>
            <SpeakerButton
              label="medicines"
              text={`Today's medicines: ${meds.map(m => `${m.name}, ${m.dose}, at ${m.time}. ${m.detail}`).join('. ')}`}
            />
          </div>
          <div className="space-y-4">
            {meds.map((med) => (
              <button
                key={med.id}
                type="button"
                onClick={() => toggleMed(med.id)}
                className={`w-full text-left p-7 rounded-3xl border-4 transition-all flex items-center gap-6 shadow-sm ${
                  med.taken
                    ? 'bg-primary/5 border-primary/40'
                    : 'bg-white border-slate-300 hover:border-primary'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-4 transition-colors flex-shrink-0 ${
                  med.taken ? 'bg-primary border-primary text-white' : 'border-slate-400 bg-white'
                }`}>
                  {med.taken && <CheckCircle2 className="w-10 h-10" />}
                </div>
                <div>
                  <h3 className={`text-2xl font-black ${med.taken ? 'line-through text-slate-500' : 'text-slate-950'}`}>
                    {med.name} — {med.dose}
                  </h3>
                  <p className="text-xl font-semibold text-slate-700 mt-1">{med.time} · {med.detail}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Call Caregiver */}
        <section id="caregiver">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-4xl font-black text-slate-950 flex items-center gap-3">
              <Heart className="w-10 h-10 text-rose-600" />
              Call My Caregiver
            </h2>
            <SpeakerButton label="caregivers" text="Sister Mary Joseph is your nurse today. Karthik Sundaram, your son, is also available." />
          </div>
          <div className="space-y-4">
            <a href="tel:+919840011223" className="flex items-center justify-between p-7 rounded-3xl bg-blue-50 border-4 border-blue-300 hover:border-blue-500 transition-colors shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-blue-200 text-blue-900 font-black flex items-center justify-center text-2xl border-2 border-blue-400">RN</div>
                <div>
                  <h4 className="font-black text-2xl text-slate-950">Sister Mary Joseph</h4>
                  <p className="text-lg font-bold text-blue-800">Nurse — Day Shift</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-700 text-white px-6 py-4 rounded-2xl font-black text-xl">
                <PhoneCall className="w-7 h-7" /> Call Nurse
              </div>
            </a>
            <a href="tel:+919840123456" className="flex items-center justify-between p-7 rounded-3xl bg-purple-50 border-4 border-purple-300 hover:border-purple-500 transition-colors shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-purple-200 text-purple-900 font-black flex items-center justify-center text-2xl border-2 border-purple-400">KS</div>
                <div>
                  <h4 className="font-black text-2xl text-slate-950">Karthik Sundaram</h4>
                  <p className="text-lg font-bold text-purple-800">Son & Daily Caregiver</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-purple-700 text-white px-6 py-4 rounded-2xl font-black text-xl">
                <PhoneCall className="w-7 h-7" /> Call Son
              </div>
            </a>
          </div>
        </section>
      </div>
    );
  }

  // ─── Full Mode (none / early stage) ───────────────────────────────────────
  return (
    <div className="space-y-8 text-slate-900">

      {/* ── Emergency SOS — single primary emergency path ── */}
      <section id="emergency" className="scroll-mt-24">
        {sosTriggered ? (
          <div className="rounded-3xl border-4 border-red-600 bg-red-100 p-8 text-center space-y-4 animate-pulse">
            <ShieldAlert className="w-20 h-20 text-red-600 mx-auto" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-red-950">EMERGENCY ALERT SENT</h2>
            <p className="text-xl font-bold text-red-900">
              Dr. Vikram Malhotra and your son Karthik have been paged.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Button asChild size="lg" className="bg-red-700 hover:bg-red-800 text-white font-black text-xl h-20 px-10 rounded-2xl">
                <a href="tel:108">
                  <PhoneCall className="w-7 h-7 mr-2" />
                  Call Ambulance (108)
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setSosTriggered(false)}
                className="h-20 px-8 text-xl font-black rounded-2xl border-2 border-red-400"
              >
                Cancel Alert
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border-4 border-red-500 bg-red-50/90 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="text-center md:text-left">
              <span className="text-sm font-black uppercase tracking-widest text-red-700 bg-red-200 px-3 py-1 rounded-full">
                Instant Emergency Help
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-red-950 mt-2">
                Feeling Dizzy or Unwell?
              </h2>
              <p className="text-xl font-bold text-red-900 mt-1">
                Press the big red button to alert your doctor and family immediately.
              </p>
            </div>
            <Button
              onClick={handleTriggerSOS}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-2xl h-20 md:h-24 px-10 md:px-14 rounded-2xl shadow-lg flex items-center gap-3 w-full md:w-auto justify-center"
            >
              <AlertOctagon className="w-10 h-10" />
              EMERGENCY HELP (SOS)
            </Button>
          </div>
        )}
      </section>

      {/* ── Greeting + Mood Check-in ── */}
      <div className="rounded-3xl bg-primary text-primary-foreground p-6 md:p-8 shadow-md">
        <p className="text-base font-black uppercase tracking-wider text-primary-foreground/80">Personal Health Home</p>
        <h1 className="text-4xl md:text-5xl font-extrabold mt-1">Good day, Devaki</h1>
        <p className="text-xl text-primary-foreground/90 mt-3 max-w-2xl leading-relaxed">
          You are doing well today. Your heart recovery plan is active under{' '}
          <span className="text-white font-bold underline">Dr. Vikram Malhotra</span>.
        </p>

        {/* Mood Check-in — large buttons */}
        <div className="mt-6 pt-5 border-t border-primary-foreground/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-black text-primary-foreground/90">How do you feel right now?</span>
            <SpeakerButton label="mood check" text="How do you feel right now? Choose Good, Fair, or Not Well." />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {(['Good', 'Fair', 'Not Well'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTodayMood(m)}
                className={`min-h-[64px] px-7 py-4 rounded-2xl text-xl font-black transition-transform shadow-sm ${
                  todayMood === m
                    ? 'bg-white text-primary scale-105 shadow-md'
                    : 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                }`}
              >
                {m === 'Good' && '😊 Good'}
                {m === 'Fair' && '😐 Fair'}
                {m === 'Not Well' && '😔 Not Well'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Today's Medicines ── */}
      <section id="medicines" className="scroll-mt-24 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl md:text-4xl font-black text-slate-950 flex items-center gap-3">
              <Pill className="w-10 h-10 text-primary" />
              Today&apos;s Medicines
            </h2>
            <SpeakerButton
              label="medicines"
              text={`Today's medicines: ${meds.map(m => `${m.name}, ${m.dose}, at ${m.time}. ${m.detail}`).join('. ')}`}
            />
          </div>
          <span className="text-xl font-black bg-primary/10 text-primary px-5 py-2 rounded-full border border-primary/20">
            {meds.filter(m => m.taken).length} of {meds.length} Taken
          </span>
        </div>

        <p className="text-xl text-slate-700 font-semibold -mt-2">
          Tap any medicine to check it off after you swallow it.
        </p>

        <div className="space-y-5">
          {meds.map((med) => (
            <button
              type="button"
              key={med.id}
              onClick={() => toggleMed(med.id)}
              className={`w-full text-left p-6 md:p-7 rounded-3xl border-4 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-sm ${
                med.taken
                  ? 'bg-primary/5 border-primary/40 opacity-90'
                  : 'bg-white border-slate-300 hover:border-primary'
              }`}
            >
              <div className="flex items-center gap-6">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-colors flex-shrink-0 ${
                    med.taken ? 'bg-primary border-primary text-white' : 'border-slate-400 bg-white'
                  }`}
                >
                  {med.taken && <CheckCircle2 className="w-9 h-9" />}
                </div>
                <div>
                  <h3 className={`text-2xl md:text-3xl font-black ${med.taken ? 'line-through text-slate-500' : 'text-slate-950'}`}>
                    {med.name} — {med.dose}
                  </h3>
                  {/* High-contrast dark text, not gray */}
                  <p className="text-lg md:text-xl font-semibold text-slate-700 mt-1">
                    {med.detail}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xl md:text-2xl font-black bg-slate-100 text-slate-900 px-5 py-3 rounded-xl border-2 border-slate-300">
                  {med.time}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Appointments & Care Team ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Next Appointment */}
        <Card id="appointments" className="scroll-mt-24 border-4 border-blue-200 rounded-3xl p-2">
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-2.5 text-slate-950">
              <Calendar className="w-8 h-8 text-blue-600" />
              Next Doctor Visit
              <SpeakerButton
                label="next appointment"
                text="Next appointment: Tuesday, 15th September 2026 at 10:30 AM with Dr. Vikram Malhotra at the Cardiothoracic Clinic. It is a heart failure follow-up and routine ECG check."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5 space-y-5">
            <div className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-5">
              <p className="text-2xl font-black text-blue-950">Tuesday, 15 Sep 2026 at 10:30 AM</p>
              <p className="text-xl font-bold text-blue-900 mt-2">
                Dr. Vikram Malhotra (Cardiothoracic Clinic)
              </p>
              {/* High contrast — dark text, not light gray */}
              <p className="text-lg font-semibold text-slate-800 mt-2">
                Heart failure follow-up & routine ECG check.
              </p>
            </div>
            <Button size="lg" asChild className="w-full h-16 text-xl font-black rounded-2xl bg-blue-700 hover:bg-blue-800">
              <Link href="/patient/messages">
                <MessageSquare className="w-6 h-6 mr-2" />
                Ask Doctor a Question
              </Link>
            </Button>
            {/* Clarifying response-time note */}
            <p className="text-base font-semibold text-slate-700 text-center leading-snug">
              Non-urgent — doctor usually replies within 24 hours.{' '}
              <span className="font-black text-red-700">For urgent problems, use Emergency Help above.</span>
            </p>
          </CardContent>
        </Card>

        {/* Caregivers on Duty */}
        <Card id="caregiver" className="scroll-mt-24 border-4 border-slate-200 rounded-3xl p-2">
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-2.5 text-slate-950">
              <Heart className="w-8 h-8 text-rose-600" />
              My Caregivers on Duty
              <SpeakerButton
                label="caregivers"
                text="Sister Mary Joseph is your nurse today on the day shift. Karthik Sundaram, your son, is your daily caregiver."
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5 space-y-4">
            {/* Nurse */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-blue-50 border-4 border-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-200 text-blue-900 font-black text-xl flex items-center justify-center border-2 border-blue-400 flex-shrink-0">
                  RN
                </div>
                <div>
                  <h4 className="font-black text-xl text-slate-950">Sister Mary Joseph</h4>
                  <p className="text-base font-bold text-blue-800">Verified Nurse (Day Shift)</p>
                </div>
              </div>
              <a
                href="tel:+919840011223"
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-black text-lg px-5 py-4 rounded-2xl transition-colors min-h-[56px]"
              >
                <PhoneCall className="w-6 h-6" />
                Call Nurse
              </a>
            </div>

            {/* Son */}
            <div className="flex items-center justify-between p-5 rounded-2xl bg-purple-50 border-4 border-purple-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-purple-200 text-purple-900 font-black text-xl flex items-center justify-center border-2 border-purple-400 flex-shrink-0">
                  KS
                </div>
                <div>
                  <h4 className="font-black text-xl text-slate-950">Karthik Sundaram</h4>
                  <p className="text-base font-bold text-purple-800">Son & Daily Caregiver</p>
                </div>
              </div>
              <a
                href="tel:+919840123456"
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-lg px-5 py-4 rounded-2xl transition-colors min-h-[56px]"
              >
                <PhoneCall className="w-6 h-6" />
                Call Son
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
