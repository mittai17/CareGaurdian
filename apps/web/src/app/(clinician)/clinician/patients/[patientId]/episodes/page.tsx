import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { demoPatient, demoEpisodes, demoYearTimeline } from '@/lib/demo-data';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Episode Comparison' };

const similarityColor = (score: number) => {
  if (score >= 0.8) return 'text-red-700 bg-red-50 border-red-200';
  if (score >= 0.65) return 'text-orange-700 bg-orange-50 border-orange-200';
  return 'text-yellow-700 bg-yellow-50 border-yellow-200';
};

export default function EpisodesPage({ params }: { params: { patientId: string } }) {
  const patient = {
    id: demoPatient.id, firstName: demoPatient.firstName, lastName: demoPatient.lastName,
    dateOfBirth: demoPatient.dateOfBirth, gender: demoPatient.gender,
    primaryDoctor: demoPatient.primaryDoctor, lastClinicalReview: demoPatient.lastClinicalReview,
    careCircleCount: demoPatient.careCircleCount, status: demoPatient.status,
    currentYearStatus: demoYearTimeline.years.find(y => y.year === demoYearTimeline.currentYear)?.status,
  };

  const episodes = demoEpisodes;
  const currentPattern = [
    { event: 'Medication changed (Metformin dose doubled)', date: '2026-09-02' },
    { event: 'Appetite reduced', date: '2026-09-06' },
    { event: 'Mobility reduced (37% below baseline)', date: '2026-09-08' },
    { event: 'Confusion reports (4 observations)', date: '2026-09-10' },
  ];

  return (
    <>
      <PatientHeader patient={patient} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Historical Episode Comparison</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing current pattern with {patient.firstName}&apos;s previous health episodes.
            Pattern similarity does not establish causation or predict outcomes.
          </p>
        </div>

        {/* Current pattern */}
        <Card className="border-2 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Current Pattern — 2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-4">
              <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary/30" />
              {currentPattern.map((step, i) => (
                <div key={i} className="relative flex items-start gap-3 pb-3">
                  <div className="absolute -left-[17px] mt-1.5 h-3 w-3 rounded-full border-2 border-primary bg-white" />
                  <div>
                    <p className="text-sm font-medium">{step.event}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(step.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Past episodes */}
        <h2 className="text-lg font-semibold">Previous Episodes</h2>
        <div className="space-y-5">
          {episodes.map((ep) => (
            <Card key={ep.id} className="card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold">{ep.title}</h3>
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', similarityColor(ep.similarityScore))}>
                        {ep.similarityLabel} ({Math.round(ep.similarityScore * 100)}%)
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatDate(ep.startDate)} → {ep.endDate ? formatDate(ep.endDate) : 'Ongoing'}
                    </p>
                  </div>
                  <Badge variant={ep.severity === 'CRITICAL' ? 'destructive' : 'warning'}>{ep.severity}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Past episode pattern */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Episode Pattern</p>
                    <div className="relative pl-4">
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-200" />
                      {ep.pattern.map((step, i) => {
                        const isShared = currentPattern.some(cp =>
                          cp.event.toLowerCase().split(' ').some(word => word.length > 4 && step.event.toLowerCase().includes(word))
                        );
                        return (
                          <div key={i} className="relative flex items-start gap-3 pb-3">
                            <div className={cn('absolute -left-[17px] mt-1.5 h-3 w-3 rounded-full border-2 bg-white',
                              isShared ? 'border-orange-500' : 'border-gray-300'
                            )} />
                            <div>
                              <p className={cn('text-sm', isShared ? 'font-semibold text-orange-700' : 'text-muted-foreground')}>
                                {step.event}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatDate(step.date)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Episode details */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Outcome</p>
                      <p className="text-sm">{ep.outcome}</p>
                    </div>
                    {ep.symptoms.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Symptoms</p>
                        <div className="flex flex-wrap gap-1">
                          {ep.symptoms.map((s: string) => (
                            <span key={s} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ep.medicationsInvolved.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Medications Involved</p>
                        <div className="flex flex-wrap gap-1">
                          {ep.medicationsInvolved.map((m: string) => (
                            <span key={m} className="rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs text-blue-700">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning */}
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 italic">{ep.warning}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
