'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pill, Plus, Search, CheckCircle2, RefreshCw, ArrowRight, X, Send, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RxItem {
  id: string;
  patientName: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  pharmacy: string;
  status: 'Active' | 'Refill Requested' | 'Discontinued' | 'Dispensed';
  startDate: string;
  refillsRemaining: number;
}

const DEMO_PATIENTS = [
  { id: '77777777-0000-4000-8000-000000000001', name: 'Devaki Sundaram' },
  { id: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380', name: 'Ramesh Patel' },
];

const PHARMACIES = [
  'Apollo Pharmacy - Chennai T. Nagar',
  'MedPlus Pharmacy',
  'Netmeds Delivery',
  '1mg Express Delivery',
];

export default function PrescriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // New Rx form state
  const [form, setForm] = useState({
    patientId: '77777777-0000-4000-8000-000000000001',
    medication: '',
    dosage: '',
    frequency: '',
    refills: '2',
    pharmacy: 'Apollo Pharmacy - Chennai T. Nagar',
    notes: '',
  });

  const [prescriptions, setPrescriptions] = useState<RxItem[]>([
    {
      id: 'rx-1',
      patientName: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      medication: 'Furosemide',
      dosage: '40mg Oral Tablet',
      frequency: 'Once daily morning',
      prescribedBy: 'Dr. Vikram Malhotra',
      pharmacy: 'Apollo Pharmacy - Chennai T. Nagar',
      status: 'Active',
      startDate: '2026-09-08',
      refillsRemaining: 3,
    },
    {
      id: 'rx-2',
      patientName: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      medication: 'Empagliflozin (Jardiance)',
      dosage: '10mg Oral Tablet',
      frequency: 'Once daily morning',
      prescribedBy: 'Dr. Vikram Malhotra',
      pharmacy: 'Apollo Pharmacy - Chennai T. Nagar',
      status: 'Active',
      startDate: '2026-08-10',
      refillsRemaining: 2,
    },
    {
      id: 'rx-3',
      patientName: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      medication: 'Spironolactone',
      dosage: '25mg Oral Tablet',
      frequency: 'Once daily with meals',
      prescribedBy: 'Dr. Vikram Malhotra',
      pharmacy: 'Apollo Pharmacy - Chennai T. Nagar',
      status: 'Active',
      startDate: '2026-08-15',
      refillsRemaining: 1,
    },
    {
      id: 'rx-4',
      patientName: 'Ramesh Patel',
      patientId: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
      medication: 'Atorvastatin',
      dosage: '20mg Oral Tablet',
      frequency: 'Once daily at bedtime',
      prescribedBy: 'Dr. Priya Sharma',
      pharmacy: 'MedPlus Pharmacy',
      status: 'Refill Requested',
      startDate: '2026-06-01',
      refillsRemaining: 0,
    }
  ]);

  const filtered = prescriptions.filter(p =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medication.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleField(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.medication.trim() || !form.dosage.trim() || !form.frequency.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));

    const patient = DEMO_PATIENTS.find(p => p.id === form.patientId)!;
    const newRx: RxItem = {
      id: `rx-${Date.now()}`,
      patientName: patient.name,
      patientId: form.patientId,
      medication: form.medication,
      dosage: form.dosage,
      frequency: form.frequency,
      prescribedBy: 'Dr. Vikram Malhotra',
      pharmacy: form.pharmacy,
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      refillsRemaining: Number(form.refills),
    };

    setPrescriptions(prev => [newRx, ...prev]);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowModal(false);
      setForm({
        patientId: '77777777-0000-4000-8000-000000000001',
        medication: '',
        dosage: '',
        frequency: '',
        refills: '2',
        pharmacy: 'Apollo Pharmacy - Chennai T. Nagar',
        notes: '',
      });
    }, 1800);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary" />
            E-Prescriptions &amp; Pharmacy Dispatch
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage active pharmacotherapy, digital refill authorizations, and pharmacy dispensing statuses.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Issue New E-Prescription
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by patient or medication name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base">Active Prescriptions ({filtered.length})</CardTitle>
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
            SureScripts / FHIR Connected
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/50 text-xs text-muted-foreground uppercase">
                <th className="text-left py-3 px-6 font-semibold">Patient</th>
                <th className="text-left py-3 px-4 font-semibold">Medication &amp; Dosage</th>
                <th className="text-left py-3 px-4 font-semibold">Instructions</th>
                <th className="text-left py-3 px-4 font-semibold">Pharmacy</th>
                <th className="text-left py-3 px-4 font-semibold">Refills</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-right py-3 px-6 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((rx) => (
                <tr key={rx.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6">
                    <Link href={`/clinician/patients/${rx.patientId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                      {rx.patientName}
                    </Link>
                    <p className="text-xs text-muted-foreground">Rx ID: {rx.id}</p>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    <div>{rx.medication}</div>
                    <div className="text-xs text-muted-foreground">{rx.dosage}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{rx.frequency}</td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{rx.pharmacy}</td>
                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-700">
                    {rx.refillsRemaining} remaining
                  </td>
                  <td className="py-3.5 px-4">
                    {rx.status === 'Active' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                    {rx.status === 'Refill Requested' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                        <RefreshCw className="w-3 h-3" /> Refill Requested
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-primary gap-1">
                      Authorize Refill <ArrowRight className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Issue New E-Prescription Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-primary/5">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">Issue New E-Prescription</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-bold text-emerald-800 text-base">E-Prescription Issued</p>
                <p className="text-xs text-muted-foreground text-center">
                  Dispatched to {form.pharmacy} via SureScripts FHIR relay.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Allergy warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  AI drug–allergy check active. Penicillin-class contraindicated for Devaki Sundaram.
                </div>

                {/* Patient */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Patient</label>
                  <select
                    value={form.patientId}
                    onChange={e => handleField('patientId', e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {DEMO_PATIENTS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Medication */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Medication Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Metformin, Amlodipine..."
                    value={form.medication}
                    onChange={e => handleField('medication', e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Dosage + Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dosage *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 500mg Oral Tablet"
                      value={form.dosage}
                      onChange={e => handleField('dosage', e.target.value)}
                      className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frequency *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Twice daily with food"
                      value={form.frequency}
                      onChange={e => handleField('frequency', e.target.value)}
                      className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Refills + Pharmacy */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Refills Authorized</label>
                    <select
                      value={form.refills}
                      onChange={e => handleField('refills', e.target.value)}
                      className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {[0,1,2,3,5,11].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pharmacy</label>
                    <select
                      value={form.pharmacy}
                      onChange={e => handleField('pharmacy', e.target.value)}
                      className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {PHARMACIES.map(ph => (
                        <option key={ph} value={ph}>{ph}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clinical Notes (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Special instructions, contraindication acknowledgements..."
                    value={form.notes}
                    onChange={e => handleField('notes', e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="gap-1.5 min-w-[160px]">
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Issue &amp; Dispatch
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
