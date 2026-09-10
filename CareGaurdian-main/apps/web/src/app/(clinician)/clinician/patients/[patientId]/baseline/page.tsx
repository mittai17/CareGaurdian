import type { Metadata } from 'next';
import { TrendingDown, TrendingUp, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { demoPatient, demoBaseline, demoYearTimeline } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Personal Baseline' };

const confidenceConfig: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'High confidence', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  MODERATE: { label: 'Moderate confidence', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  LOW: { label: 'Limited data', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  INSUFFICIENT_DATA: { label: 'Insufficient data', color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

export default function BaselinePage() {
  const patient = {
    id: demoPatient.id, firstName: demoPatient.firstName, lastName: demoPatient.lastName,
    dateOfBirth: demoPatient.dateOfBirth, gender: demoPatient.gender,
    primaryDoctor: demoPatient.primaryDoctor, lastClinicalReview: demoPatient.lastClinicalReview,
    careCircleCount: demoPatient.careCircleCount, status: demoPatient.status,
    currentYearStatus: demoYearTimeline.years.find(y => y.year === demoYearTimeline.currentYear)?.status,
  };

  const baseline = demoBaseline;

  return (
    <>
      <PatientHeader patient={patient} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Personal Baseline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {patient.firstName}&apos;s personal normal pattern, established from historical data. Not a population comparison.
          </p>
        </div>

        {/* What is this */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
            <Info className="h-4 w-4" /> How Personal Baseline Works
          </p>
          <p className="text-sm text-blue-700 mt-2">
            Baseline learns {patient.firstName}&apos;s <strong>personal normal state</strong> from historical data.
            It never compares against population averages.
            If there is insufficient data, the system will say so — it will never fabricate a baseline.
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Baseline period: Previous 90 days · Computed: {new Date(baseline.computedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {baseline.metrics.map((metric) => {
            const confCfg = confidenceConfig[metric.confidence] ?? confidenceConfig.INSUFFICIENT_DATA;
            const isInsufficientData = metric.confidence === 'INSUFFICIENT_DATA';
            const hasMeaningfulChange = metric.change !== null && Math.abs(metric.change) >= 10;

            return (
              <Card key={metric.metric} className={cn('card-hover', hasMeaningfulChange && metric.trend === 'down' && 'border-orange-200')}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-base">{metric.label}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{metric.description}</p>
                        </div>
                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium flex-shrink-0', confCfg.color)}>
                          {confCfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {/* Normal range */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Normal Range</p>
                          <p className="text-sm font-semibold">{metric.normalRange}</p>
                        </div>
                        {/* Current */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Current</p>
                          <p className={cn('text-sm font-semibold',
                            metric.trend === 'down' && metric.change !== null ? 'text-red-600' :
                            metric.trend === 'up' && metric.change !== null ? 'text-red-600' : ''
                          )}>
                            {metric.current}
                          </p>
                        </div>
                        {/* Change */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Change</p>
                          {metric.change !== null ? (
                            <div className={cn('flex items-center gap-1 text-sm font-semibold',
                              metric.trend === 'down' ? 'text-red-600' : 'text-emerald-600'
                            )}>
                              {metric.trend === 'down' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Qualitative</p>
                          )}
                        </div>
                        {/* Data quality */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Data Quality</p>
                          {isInsufficientData ? (
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Not enough data</span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">{metric.sampleCount} samples · {metric.periodDays}d period</p>
                          )}
                        </div>
                      </div>

                      {/* Progress bar for numeric metrics */}
                      {metric.change !== null && metric.currentValue !== null && metric.baselineValue !== null && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>0</span>
                            <span>Baseline: {metric.baselineValue.toLocaleString()} {metric.unit}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 relative overflow-hidden">
                            {/* Baseline marker */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400" style={{ left: '100%' }} />
                            {/* Current value bar */}
                            <div
                              className={cn('h-full rounded-full transition-all', metric.trend === 'down' ? 'bg-red-400' : 'bg-emerald-400')}
                              style={{ width: `${Math.min(100, (metric.currentValue / metric.baselineValue) * 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>Current: {metric.currentValue.toLocaleString()} {metric.unit}</span>
                            <span className={metric.trend === 'down' ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
                              {metric.change}% from baseline
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground italic text-center">
          Baseline uses historical data to identify meaningful personal deviations — not population averages.
          All changes require clinical review before any conclusions are drawn.
        </p>
      </div>
    </>
  );
}
