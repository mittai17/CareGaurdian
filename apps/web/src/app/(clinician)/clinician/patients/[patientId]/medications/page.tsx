import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle, Clock, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientHeader } from '@/components/patient/patient-header';
import { demoPatient, demoMedications, demoYearTimeline } from '@/lib/demo-data';
import { cn, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Medications' };

const signalConfig: Record<string, { label: string; color: string; icon: string }> = {
  ADHERENCE_DECLINE: { label: 'Adherence ↓', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: '📉' },
  RECENT_CHANGE: { label: 'Recent Change', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🔄' },
  POTENTIAL_ALLERGY_CONFLICT: { label: '⚠️ Allergy Conflict', color: 'bg-red-50 text-red-700 border-red-200', icon: '⚠️' },
  POTENTIAL_INTERACTION: { label: 'Potential Interaction', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '⚡' },
};

export default function MedicationsPage() {
  const patient = {
    id: demoPatient.id, firstName: demoPatient.firstName, lastName: demoPatient.lastName,
    dateOfBirth: demoPatient.dateOfBirth, gender: demoPatient.gender,
    primaryDoctor: demoPatient.primaryDoctor, lastClinicalReview: demoPatient.lastClinicalReview,
    careCircleCount: demoPatient.careCircleCount, status: demoPatient.status,
    currentYearStatus: demoYearTimeline.years.find(y => y.year === demoYearTimeline.currentYear)?.status,
  };

  const meds = demoMedications;
  const criticalMeds = meds.filter(m => m.signals.includes('POTENTIAL_ALLERGY_CONFLICT'));

  return (
    <>
      <PatientHeader patient={patient} />
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
          {meds.map((med) => (
            <Card key={med.id} className={cn('card-hover', med.signals.includes('POTENTIAL_ALLERGY_CONFLICT') && 'border-red-300')}>
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
                    {med.signals.length > 0 && (
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
                  {med.adherence !== null && (
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
