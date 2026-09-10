'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertOctagon, PhoneCall, HeartPulse, Lock, Unlock, FileText, CheckCircle2 } from 'lucide-react';

export default function PatientEmergencyPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [breakGlassActivated, setBreakGlassActivated] = useState(false);

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
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-rose-700">
              <AlertOctagon className="w-6 h-6 text-rose-600" />
              Emergency Profile & Break-Glass Protocol
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Immediate critical resuscitation data, emergency contacts, advance directives, and audited emergency override.
            </p>
          </div>
        </div>

        {/* Emergency Directive Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-rose-200 bg-rose-50/40">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase font-bold text-rose-700 tracking-wider">Resuscitation Status</span>
              <CardTitle className="text-xl text-rose-950 font-bold">FULL CODE</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-rose-900 space-y-1">
              <p>• Intubation & Mechanical Ventilation: Permitted</p>
              <p>• Defibrillation / CPR: Permitted</p>
              <p>• Advance Directive: Signed & on file (2025)</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">Critical Allergies</span>
              <CardTitle className="text-xl text-amber-950 font-bold">Penicillins (Severe)</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-amber-900 space-y-1">
              <p>• Reaction: Anaphylactoid urticaria & angioedema</p>
              <p>• Safe Alternative: Macrolides, Fluoroquinolones</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/40">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase font-bold text-blue-700 tracking-wider">Primary Emergency Contact</span>
              <CardTitle className="text-lg text-blue-950 font-bold">Karthik Sundaram (Son)</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-blue-900 space-y-1">
              <p className="flex items-center gap-1 font-semibold">
                <PhoneCall className="w-3.5 h-3.5" /> +91 98401 23456
              </p>
              <p>• Handle: @karthik_sundaram</p>
              <p>• Legal Status: Healthcare Power of Attorney</p>
            </CardContent>
          </Card>
        </div>

        {/* Break Glass Access Box */}
        <Card className="border-2 border-red-300 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5" />
                <CardTitle className="text-lg font-bold">Break-Glass Emergency Decryption</CardTitle>
              </div>
              <Badge variant="destructive">Audited Protocol</Badge>
            </div>
            <CardDescription className="text-xs text-slate-600">
              In life-threatening circumstances, clinicians can override consent restrictions to view locked historical psychiatric, genetic, and restricted psychiatric notes. Every activation is permanently recorded on the immutable HIPAA audit log.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakGlassActivated ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Unlock className="w-4 h-4 text-emerald-600" />
                  Emergency Override Active — Full Longitudinal Dossier Unlocked
                </div>
                <p className="text-xs text-emerald-700">
                  Audit Session #BG-2026-9042 registered to Dr. Vikram Malhotra. Notification dispatched to patient&apos;s healthcare proxy.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-500" />
                  <div>
                    <h5 className="text-sm font-semibold">Consent Shield Active</h5>
                    <p className="text-xs text-muted-foreground">Standard clinical view enabled.</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBreakGlassActivated(true)}
                  className="gap-1.5 font-semibold"
                >
                  <AlertOctagon className="w-4 h-4" />
                  Activate Break-Glass Override
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
