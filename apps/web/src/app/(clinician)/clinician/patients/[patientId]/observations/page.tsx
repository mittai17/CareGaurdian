"use client";

import { useEffect, useState } from 'react';
import { Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi } from '@/lib/api';
import { cn, formatDate, timeAgo } from '@/lib/utils';

const categoryIcons: Record<string, string> = {
  CONFUSION: '🧠', FALL: '⚠️', NEAR_FALL: '⚠️', APPETITE: '🍽️',
  SLEEP: '😴', MOBILITY: '🚶', MOOD: '💬', PAIN: '🩺', MEDICATION: '💊', OTHER: '💬',
};

const statusStyle: Record<string, string> = {
  REPORTED: 'bg-blue-50 text-blue-700 border-blue-200',
  MEASURED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLINICALLY_VERIFIED: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function ObservationsPage({ params }: { params: { patientId: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const summary = await patientsApi.summary(params.patientId).catch(() => null);
        setData({
          patient: summary?.patient,
          reports: [],
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.patientId]);

  if (loading) return <div className="p-6">Loading observations...</div>;
  if (!data?.patient) return <div className="p-6 text-red-500">Patient not found</div>;

  const { patient, reports } = data;

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
  };

  return (
    <>
      <PatientHeader patient={patientData} />
      <div className="p-6 space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Observations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All reported observations from the Care Circle and clinical records. Original text preserved.
          </p>
        </div>
        <div className="space-y-3">
          {reports.map((r: any) => {
            const icon = categoryIcons[r.category] ?? '💬';
            const stStyle = statusStyle[r.status] ?? statusStyle.REPORTED;
            return (
              <Card key={r.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                      {r.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{r.reporter}</span>
                        <span className="text-xs text-muted-foreground">— {r.relationship}</span>
                        <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(r.date)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-foreground italic">&ldquo;{r.text}&rdquo;</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-sm">{icon}</span>
                        <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', stStyle)}>
                          Reported Observation
                        </span>
                        <p className="ml-auto text-xs text-muted-foreground">{formatDate(r.date)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground italic text-center">
          Original observations are never altered. AI interpretation is stored separately.
        </p>
      </div>
    </>
  );
}
