"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi, medicationsApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { MOCK_MEDICATIONS } from '@/lib/mock-patient-details';
import { cn, formatDate } from '@/lib/utils';

const signalConfig: Record<string, { label: string; color: string; icon: string }> = {
  ADHERENCE_DECLINE: { label: 'Adherence ↓', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '📉' },
  RECENT_CHANGE: { label: 'Recent Change', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🔄' },
  POTENTIAL_ALLERGY_CONFLICT: { label: '⚠️ Allergy Conflict', color: 'bg-red-50 text-red-700 border-red-200', icon: '⚠️' },
  POTENTIAL_INTERACTION: { label: 'Potential Interaction', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '⚡' },
};

export default function MedicationsPage({ params }: { params: { patientId: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summary, medsResp] = await Promise.all([
          patientsApi.summary(params.patientId).catch(() => null),
          medicationsApi.list(params.patientId).catch(() => null),
        ]);
        const fallbackPatient = MOCK_PATIENTS_MAP[params.patientId] || {
          id: params.patientId,
          firstName: 'Devaki',
          lastName: 'Sundaram',
          dateOfBirth: '1954-03-12',
          gender: 'Female',
        };

        const isDevaki = params.patientId === '77777777-0000-4000-8000-000000000001';
        const resolvedMeds = isDevaki 
          ? MOCK_MEDICATIONS 
          : (!medsResp || (Array.isArray(medsResp) && medsResp.length === 0))
            ? MOCK_MEDICATIONS
            : medsResp;

        setData({
          patient: summary?.patient || fallbackPatient,
          meds: resolvedMeds,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.patientId]);

  if (loading) return <div className="p-6">Loading medications...</div>;
  if (!data?.patient) return <div className="p-6 text-red-500">Patient not found</div>;

  const { patient, meds } = data;

  const patientData = {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    primaryDoctor: 'Dr. Elena Chen',
    lastClinicalReview: patient.updatedAt,
    careCircleCount: 5,
    status: 'ACTIVE',
    currentYearStatus: 'ACTIVE',
    aadhaarNo: patient.aadhaarNo ?? MOCK_PATIENTS_MAP[patient.id]?.aadhaarNo,
  };

  const criticalMeds = meds.filter((m: any) => m.signals?.includes('POTENTIAL_ALLERGY_CONFLICT'));

  return (
    <>
      <PatientHeader patient={patientData} />
      <div className="p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Medications</h1>
            <p className="text-sm text-muted-foreground mt-1">{meds.length} active medications</p>
          </div>
        </div>

        {/* Critical alert */}
        {criticalMeds.length > 0 && (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">⚠️ Potential Allergy Conflict — Requires Immediate Review</p>
              <p className="text-sm text-red-700 mt-1">
                Amoxicillin (penicillin-class) is currently prescribed. A 2025 record documents penicillin allergy (reaction: rash).
                The 2026 outpatient record documents no known drug allergies. This conflict must be resolved.
              </p>
              <Button size="sm" variant="outline" className="mt-2 border-red-300 text-red-700 hover:bg-red-100">
                Review Conflict
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {meds.map((med: any) => (
            <Card key={med.id} className={cn('card-hover', med.signals?.includes('POTENTIAL_ALLERGY_CONFLICT') && 'border-red-300')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{med.name}</h3>
                      <span className="text-sm text-muted-foreground">{med.genericName}</span>
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        med.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600'
                      )}>
                        {med.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{med.dosage}</span>
                      <span>·</span>
                      <span>{med.frequency}</span>
                      <span>·</span>
                      <span>Started {formatDate(med.startedAt)}</span>
                    </div>
                    {med.prescribedBy && (
                      <p className="text-xs text-muted-foreground mt-1">Prescribed by {med.prescribedBy}</p>
                    )}
                    {med.recentChange && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-blue-700">
                        <Clock className="h-3.5 w-3.5" />
                        Changed {formatDate(med.recentChange.date)} — {med.recentChange.description}
                      </div>
                    )}
                    {med.signals && med.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {med.signals.map((signal: string) => {
                          const sc = signalConfig[signal] ?? { label: signal, color: 'bg-gray-50 text-gray-600 border-gray-200', icon: '' };
                          return (
                            <span key={signal} className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium', sc.color)}>
                              {sc.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Adherence */}
                  {med.adherence !== null && med.adherence !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground mb-1">Adherence</p>
                      <p className={cn('text-2xl font-bold', med.adherence < 80 ? 'text-red-600' : med.adherence < 90 ? 'text-orange-600' : 'text-emerald-600')}>
                        {med.adherence}%
                      </p>
                      {med.baselineAdherence && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span>Baseline {med.baselineAdherence}%</span>
                        </div>
                      )}
                      <div className="mt-2 h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden ml-auto">
                        <div
                          className={cn('h-full rounded-full', med.adherence < 80 ? 'bg-red-400' : med.adherence < 90 ? 'bg-orange-400' : 'bg-emerald-400')}
                          style={{ width: `${med.adherence}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground italic text-center">
          Medication signals are for clinical review only. Never alter medications without clinician assessment.
        </p>
      </div>
    </>
  );
}
