"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Stethoscope, Building2, Calendar, Clock, ArrowRight, ActivitySquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi, encountersApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

const encounterTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  OUTPATIENT: { label: 'Outpatient Visit', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Stethoscope },
  EMERGENCY:  { label: 'Emergency Visit', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  INPATIENT:  { label: 'Inpatient Admission', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Building2 },
  TELEHEALTH: { label: 'Telehealth', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Calendar },
};

export default function EpisodesPage({ params }: { params: { patientId: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summary, encountersResp] = await Promise.all([
          patientsApi.summary(params.patientId).catch(() => null),
          encountersApi.list(params.patientId).catch(() => []),
        ]);

        const fallbackPatient = MOCK_PATIENTS_MAP[params.patientId] || {
          id: params.patientId,
          firstName: 'Patient',
          lastName: '',
          dateOfBirth: '1950-01-01',
          gender: 'Unknown',
        };

        const encounters = Array.isArray(encountersResp)
          ? encountersResp
          : (encountersResp as any)?.encounters ?? [];

        setData({
          patient: summary?.patient || fallbackPatient,
          encounters,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.patientId]);

  if (loading) return <div className="p-6">Loading clinical visit history...</div>;
  if (!data?.patient) return <div className="p-6 text-red-500">Patient not found</div>;

  const { patient, encounters } = data;

  const patientData = {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    primaryDoctor: patient.primaryDoctor ?? 'Assigned Clinician',
    lastClinicalReview: patient.updatedAt,
    careCircleCount: 5,
    status: 'ACTIVE',
    currentYearStatus: patient.currentYearStatus ?? 'ACTIVE',
  };

  const emergencyVisits = encounters.filter((e: any) => e.type === 'EMERGENCY');
  const outpatientVisits = encounters.filter((e: any) => e.type !== 'EMERGENCY');

  return (
    <>
      <PatientHeader patient={patientData} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Clinical Visit History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {encounters.length} recorded clinical encounters for {patient.firstName} {patient.lastName}.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{outpatientVisits.length}</p>
                  <p className="text-xs text-blue-700 font-medium">Outpatient Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{emergencyVisits.length}</p>
                  <p className="text-xs text-red-700 font-medium">Emergency Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <ActivitySquare className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-900">{encounters.length}</p>
                  <p className="text-xs text-emerald-700 font-medium">Total Encounters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Encounter list */}
        {encounters.length === 0 ? (
          <Card>
            <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
              <ActivitySquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No clinical encounters recorded yet.</p>
              <p className="text-sm mt-1">Encounters will appear here as they are logged.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">All Encounters</h2>
            {encounters.map((enc: any) => {
              const cfg = encounterTypeConfig[enc.type] ?? encounterTypeConfig.OUTPATIENT;
              const Icon = cfg.icon;
              return (
                <Card key={enc.id} className={cn('card-hover border', enc.type === 'EMERGENCY' && 'border-red-200')}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg border', cfg.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{enc.reason ?? enc.type}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Stethoscope className="h-3.5 w-3.5" />
                              {enc.providerName ?? 'Clinician'}
                            </span>
                            {enc.location && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {enc.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className={cn('text-xs border', cfg.color)}>{cfg.label}</Badge>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {enc.startedAt ? formatDate(enc.startedAt) : '—'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  {enc.notes && (
                    <CardContent className="pt-0">
                      <div className="rounded-lg bg-muted/40 border border-muted px-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Clinical Notes</p>
                        <p className="text-sm">{enc.notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 italic">
            This list shows clinical encounters recorded in CareGuardian. For a complete hospital discharge history,
            consult the patient&apos;s full medical records.
          </p>
        </div>
      </div>
    </>
  );
}
