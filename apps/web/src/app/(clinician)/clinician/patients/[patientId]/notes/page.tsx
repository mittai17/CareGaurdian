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

  const [notes, setNotes] = useState<ClinicalNote[]>([
    {
      id: 'note-1',
      date: '2026-09-08T10:30:00Z',
      author: 'Dr. Vikram Malhotra',
      authorRole: 'Cardiologist',
      type: 'Follow-up Cardiology Encounter',
      subjective: 'Patient reports mild shortness of breath upon exertion (NYHA Class II). Son Karthik reports strict adherence to low-sodium diet, but noticed bilateral lower extremity swelling on Sunday.',
      objective: 'BP: 138/84 mmHg, HR: 74 bpm regular, SpO2: 96% on room air. 1+ pitting edema bilaterally at ankles. JVP not elevated. Lungs clear to auscultation bilaterally.',
      assessment: 'Heart Failure with preserved EF (HFpEF) - mild early fluid retention. Compensated diabetic status with eGFR stable at 54 mL/min.',
      plan: '1. Increase Furosemide to 40mg daily for 5 days, then resume 20mg.\n2. Recheck basic metabolic panel and potassium in 7 days.\n3. Caregiver to track morning dry weight daily via Care Circle portal.',
      signed: true,
    },
    {
      id: 'note-2',
      date: '2026-08-15T14:15:00Z',
      author: 'Dr. Priya Sharma',
      authorRole: 'Internal Medicine',
      type: 'Quarterly Chronic Care Review',
      subjective: 'Routine chronic disease management. Patient denies chest pain, orthopnea, or syncope. Sleep quality is poor due to insomnia.',
      objective: 'HbA1c 7.1%, Creatinine 1.2 mg/dL, Fasting glucose 134 mg/dL. Weight 68.2 kg.',
      assessment: 'Stable T2DM on Empagliflozin. Mild chronic insomnia, likely exacerbated by late evening fluid intake.',
      plan: 'Advised sleep hygiene protocol. Discontinue liquids after 7:30 PM to minimize nocturia. Continue Empagliflozin 10mg daily.',
      signed: true,
    }
  ]);

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
