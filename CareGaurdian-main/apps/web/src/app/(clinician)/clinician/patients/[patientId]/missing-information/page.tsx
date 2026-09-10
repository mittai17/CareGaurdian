import type { Metadata } from 'next';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PatientHeader } from '@/components/patient/patient-header';
import { demoPatient, demoMissingInfo, demoYearTimeline } from '@/lib/demo-data';
import { cn, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Information Gaps' };

const severityConfig: Record<string, { label: string; color: string }> = {
  REVIEW: { label: 'Needs Review', color: 'border-yellow-200 text-yellow-700 bg-yellow-50' },
  ATTENTION: { label: 'Attention', color: 'border-blue-200 text-blue-700 bg-blue-50' },
  CRITICAL: { label: 'Critical', color: 'border-red-200 text-red-700 bg-red-50' },
};

export default function MissingInfoPage() {
  const patient = {
    id: demoPatient.id, firstName: demoPatient.firstName, lastName: demoPatient.lastName,
    dateOfBirth: demoPatient.dateOfBirth, gender: demoPatient.gender,
    primaryDoctor: demoPatient.primaryDoctor, lastClinicalReview: demoPatient.lastClinicalReview,
    careCircleCount: demoPatient.careCircleCount, status: demoPatient.status,
    currentYearStatus: demoYearTimeline.years.find(y => y.year === demoYearTimeline.currentYear)?.status,
  };

  const gaps = demoMissingInfo;

  return (
    <>
      <PatientHeader patient={patient} />
      <div className="p-6 space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Information Gaps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Important clinical information that is missing, outdated, or incomplete.
          </p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">{gaps.filter(g => g.status === 'OPEN').length} Open Gaps Identified</p>
            <p className="text-sm text-yellow-700 mt-1">
              These gaps may affect the completeness of AI analysis and clinical decision-making.
              Each gap can be reviewed, dismissed, or actioned.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {gaps.map((gap) => {
            const sev = severityConfig[gap.severity] ?? severityConfig.ATTENTION;
            return (
              <Card key={gap.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg border flex-shrink-0', sev.color)}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{gap.category.replace(/_/g, ' ')}</h3>
                          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', sev.color)}>
                            {sev.label}
                          </span>
                          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium',
                            gap.status === 'OPEN' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600'
                          )}>
                            {gap.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{gap.description}</p>
                        {gap.recommendation && (
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-blue-700">
                            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span>{gap.recommendation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Detected {formatDate(gap.detectedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm">Request Information</Button>
                    <Button size="sm" variant="outline">Mark Reviewed</Button>
                    <Button size="sm" variant="ghost">Not Relevant</Button>
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
