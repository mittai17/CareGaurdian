import type { Metadata } from 'next';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { demoPatient, demoContradictions, demoYearTimeline } from '@/lib/demo-data';
import { cn, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Record Conflicts' };

const severityConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  CRITICAL: { label: 'Critical', icon: AlertCircle, color: 'border-red-200 bg-red-50' },
  REVIEW: { label: 'Needs Review', icon: AlertTriangle, color: 'border-yellow-200 bg-yellow-50' },
  ATTENTION: { label: 'Attention', icon: Info, color: 'border-blue-200 bg-blue-50' },
};

export default function ContradictionsPage() {
  const patient = {
    id: demoPatient.id, firstName: demoPatient.firstName, lastName: demoPatient.lastName,
    dateOfBirth: demoPatient.dateOfBirth, gender: demoPatient.gender,
    primaryDoctor: demoPatient.primaryDoctor, lastClinicalReview: demoPatient.lastClinicalReview,
    careCircleCount: demoPatient.careCircleCount, status: demoPatient.status,
    currentYearStatus: demoYearTimeline.years.find(y => y.year === demoYearTimeline.currentYear)?.status,
  };

  const contradictions = demoContradictions;

  return (
    <>
      <PatientHeader patient={patient} />
      <div className="p-6 space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Record Conflicts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contradictions detected between health records. Require human review — not automatically resolved.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">{contradictions.length} Open Conflict{contradictions.length > 1 ? 's' : ''}</p>
            <p className="text-sm text-red-700 mt-1">
              Conflicts are never silently resolved. Each requires explicit clinician review.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {contradictions.map((c) => {
            const sevCfg = severityConfig[c.severity] ?? severityConfig.REVIEW;
            const SevIcon = sevCfg.icon;
            return (
              <Card key={c.id} className={cn('border-2', c.severity === 'CRITICAL' ? 'border-red-300' : 'border-yellow-300')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0', sevCfg.color)}>
                        <SevIcon className={cn('h-5 w-5', c.severity === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600')} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{c.type.replace(/_/g, ' ')}</h3>
                          <Badge variant="outline" className={cn('text-xs', c.severity === 'CRITICAL' ? 'border-red-200 text-red-700' : 'border-yellow-200 text-yellow-700')}>
                            {sevCfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', c.status === 'OPEN' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200')}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Record A</p>
                      <p className="text-sm">{c.evidenceA}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Record B</p>
                      <p className="text-sm">{c.evidenceB}</p>
                    </div>
                  </div>
                  {c.currentMedication && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">⚠️ Current Medication</p>
                      <p className="text-sm text-red-800 mt-1">{c.currentMedication}</p>
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm">Mark as Reviewed</Button>
                    <Button size="sm" variant="outline">Add Clinical Note</Button>
                    <Button size="sm" variant="ghost">Not Relevant</Button>
                    <p className="ml-auto text-xs text-muted-foreground">
                      Detected {formatDate(c.detectedAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
