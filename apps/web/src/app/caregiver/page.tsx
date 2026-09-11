'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Activity,
  AlertTriangle,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  Pill,
  Utensils,
  Moon,
  Smile,
  Calendar,
  Stethoscope,
  CheckSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { observationsApi } from '@/lib/api';

export default function CaregiverHubPage() {
  const [observationText, setObservationText] = useState('');
  const [mealStatus, setMealStatus] = useState('Finished normal breakfast and lunch');
  const [sleepHours, setSleepHours] = useState('7 hours peaceful sleep');
  const [moodStatus, setMoodStatus] = useState('Cheerful & alert');
  const [behaviorChanges, setBehaviorChanges] = useState('No confusion or restlessness noticed');
  const [submitted, setSubmitted] = useState(false);

  // Medication checklist
  const [medReminders, setMedReminders] = useState([
    { id: '1', med: 'Furosemide 40mg', time: 'Morning (08:00 AM)', instruction: 'Give with full glass of water', taken: true },
    { id: '2', med: 'Empagliflozin 10mg', time: 'Morning (08:00 AM)', instruction: 'Give with breakfast', taken: true },
    { id: '3', med: 'Spironolactone 25mg', time: 'Afternoon (01:00 PM)', instruction: 'Give with lunch', taken: false },
  ]);

  const toggleMed = (id: string) => {
    setMedReminders(medReminders.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const [feed, setFeed] = useState([
    {
      id: '1',
      author: 'Karthik Sundaram (Son)',
      role: 'Family Caregiver',
      time: 'Today, 8:45 AM',
      text: 'Mom ate idli and sambar for breakfast. Took morning Furosemide. Dry weight was 71.6 kg.',
      tag: 'Morning Routine',
    },
    {
      id: '2',
      author: 'Sister Mary Joseph',
      role: 'Verified Nurse',
      time: 'Today, 11:30 AM',
      text: 'Checked bilateral ankle swelling. Much improved from yesterday. Sitting comfortably in veranda.',
      tag: 'Clinical Check',
    },
    {
      id: '3',
      author: 'Dr. Vikram Malhotra',
      role: 'Attending Cardiologist',
      time: 'Yesterday, 4:15 PM',
      text: 'Direct instruction: Continue 40mg Furosemide through Friday. Restrict water/fluids to 1.5L max.',
      tag: 'Doctor Instruction',
    }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entryText = `${observationText} • Meals: ${mealStatus} • Sleep: ${sleepHours} • Mood: ${moodStatus} • Behavior: ${behaviorChanges}`;
    const newEntry = {
      id: Date.now().toString(),
      author: 'Karthik Sundaram (Son)',
      role: 'Family Caregiver',
      time: 'Just now',
      text: entryText,
      tag: 'Family Observation',
    };
    setFeed([newEntry, ...feed]);
    setObservationText('');
    setSubmitted(true);

    try {
      await observationsApi.create('77777777-0000-4000-8000-000000000001', {
        category: 'MOOD',
        rawText: entryText,
        severity: 'NORMAL',
      });
    } catch (err) {
      console.warn('Caregiver observation sync:', err);
    }

    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Patient Overview Card */}
      <section id="patient-overview" className="scroll-mt-24">
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50/70 to-pink-50/70">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  DS
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">Devaki Sundaram (Mother)</h2>
                    <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full border border-purple-300">
                      Primary Patient
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    72 years • Diagnoses: <span className="font-semibold text-slate-800">Heart Failure (HFpEF) & Type 2 Diabetes</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button variant="outline" size="sm" asChild className="text-xs gap-1.5 bg-white">
                  <Link href="/clinician/messages">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Chat with Doctor
                  </Link>
                </Button>
                <Button size="sm" variant="destructive" asChild className="text-xs gap-1.5 font-bold">
                  <a href="tel:108">
                    <Phone className="w-4 h-4" />
                    Emergency (108)
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Doctor Instructions Alert Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 flex items-start gap-3 shadow-sm">
        <Stethoscope className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-bold text-blue-950">Active Instructions from Dr. Vikram Malhotra:</span>
          <p className="text-blue-900 text-xs mt-0.5">
            &ldquo;Keep daily morning dry weight between 70.0 kg and 72.0 kg. Administer Furosemide in the morning, Spironolactone after lunch. Do not give any salt biscuits or high-sodium broths.&rdquo;
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Simple Daily Observations Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-purple-950">
                <Heart className="w-4 h-4 text-rose-500" />
                Record Daily Observations
              </CardTitle>
              <CardDescription className="text-xs">
                Simple daily check: meals, sleep, mood, activities, and behavior changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 mb-3 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  Observation shared with Dr. Malhotra and Nurse Mary!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Meals & Eating</label>
                  <select
                    value={mealStatus}
                    onChange={(e) => setMealStatus(e.target.value)}
                    className="w-full rounded border px-2.5 py-1.5 bg-white"
                  >
                    <option value="Finished normal breakfast and lunch">Ate full meals normally</option>
                    <option value="Ate only half portion / reduced appetite">Ate only half portion / low appetite</option>
                    <option value="Skipped meal / refused food">Skipped meal / refused food</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Sleep Last Night</label>
                  <select
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full rounded border px-2.5 py-1.5 bg-white"
                  >
                    <option value="7 hours peaceful sleep">Slept well (7+ hours)</option>
                    <option value="Restless sleep / woke up multiple times">Restless / woke up often</option>
                    <option value="Severe insomnia / could not sleep flat">Could not sleep flat / breathless</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">Mood & Energy</label>
                  <select
                    value={moodStatus}
                    onChange={(e) => setMoodStatus(e.target.value)}
                    className="w-full rounded border px-2.5 py-1.5 bg-white"
                  >
                    <option value="Cheerful & alert">Cheerful & alert</option>
                    <option value="Tired / quiet today">Tired / quiet today</option>
                    <option value="Agitated / upset">Agitated / upset</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground mb-1">
                    Daily Notes or Specific Changes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Mom enjoyed sitting in the sunlight, walked for 10 minutes without coughing..."
                    value={observationText}
                    onChange={(e) => setObservationText(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <Button type="submit" size="sm" className="w-full gap-1.5 bg-purple-600 hover:bg-purple-700">
                  <Send className="w-3.5 h-3.5" />
                  Save Daily Observation
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Cols: Medication Reminders, Tasks, Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medication Reminders Section */}
          <Card id="reminders" className="scroll-mt-24">
            <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-600" />
                  Medication Reminders for Devaki
                </CardTitle>
                <CardDescription className="text-xs">
                  Tap to mark as given to prevent double-dosing or missed tablets.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-purple-700 bg-purple-50">
                {medReminders.filter(m => m.taken).length}/{medReminders.length} Given
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {medReminders.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMed(m.id)}
                    className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                          m.taken ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {m.taken && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold ${m.taken ? 'line-through text-slate-400' : 'text-foreground'}`}>
                          {m.med}
                        </h4>
                        <p className="text-xs text-muted-foreground">{m.instruction}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      {m.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shared Family & Doctor Activity Feed */}
          <Card>
            <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Care Circle Updates & Feed
              </CardTitle>
              <Badge variant="secondary">Live Synced</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {feed.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border bg-white space-y-1.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{item.author}</span>
                      <span className="text-xs text-muted-foreground">({item.role})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
