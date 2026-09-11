"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Calendar, AlertTriangle, CheckCircle, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { YearTimeline, YearStatusLegend } from '@/components/timeline/year-timeline';
import { HealthMetricCard, StatusBadge } from '@/components/health/health-metric-card';
import { patientsApi, timelineApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { cn, formatDate, statusConfig, type YearStatus, eventTypeConfig } from '@/lib/utils';

export default function TimelinePage({ params }: { params: { patientId: string } }) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summary, timelineResp] = await Promise.all([
          patientsApi.summary(params.patientId).catch(() => null),
          timelineApi.yearTimeline(params.patientId).catch(() => null),
        ]);
        const defaultTimeline = { currentYear: 2026, years: [{ year: 2026, label: 'Current', status: 'ACTIVE', summary: 'Active' }] };
        const fetchedTimeline = timelineResp || defaultTimeline;
        
        const fallbackPatient = MOCK_PATIENTS_MAP[params.patientId] || {
          id: params.patientId,
          firstName: 'Devaki',
          lastName: 'Sundaram',
          dateOfBirth: '1954-03-12',
          gender: 'Female',
        };

        let timelineToUse = fetchedTimeline;
        
        const isDevaki = params.patientId === '77777777-0000-4000-8000-000000000001';
        if (isDevaki) {
          const { MOCK_TIMELINE } = await import('@/lib/mock-patient-details');
          timelineToUse = MOCK_TIMELINE;
        } else {
          // If the backend returns an empty timeline (no events), override the status to match 
          // the mock patient's risk profile so High/Critical patients don't show up as 'Good'/'Stable'.
          const totalEvents = timelineToUse.years?.reduce((acc: number, y: any) => acc + (y.events?.length || 0), 0) || 0;
          if (totalEvents === 0 && fallbackPatient?.risk && timelineToUse.years?.length > 0) {
            const riskToStatus: Record<string, string> = { Critical: 'CRITICAL', High: 'CONCERN', Moderate: 'WATCH', Stable: 'STABLE' };
            const mockStatus = riskToStatus[fallbackPatient.risk] || 'ACTIVE';
            
            timelineToUse = {
              ...timelineToUse,
              years: timelineToUse.years.map((y: any, idx: number) => {
                // Override the most recent year (index 0) with the mock severity
                if (idx === 0) {
                  return {
                    ...y,
                    status: mockStatus,
                    label: mockStatus.charAt(0) + mockStatus.slice(1).toLowerCase(),
                    summary: `Patient is currently marked as ${fallbackPatient.risk} risk.`,
                    reasons: fallbackPatient.conditions || y.reasons || [],
                  };
                }
                return y;
              })
            };
          }
        }

        const yearDetailMap: Record<number, any> = {};
        if (timelineToUse.years) {
          timelineToUse.years.forEach((y: any) => {
            yearDetailMap[y.year] = y;
          });
        }

        setData({
          patient: summary?.patient || fallbackPatient,
          timeline: timelineToUse,
          yearDetail: yearDetailMap,
        });
        setSelectedYear(timelineToUse.currentYear);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.patientId]);

  if (loading) return <div className="p-6">Loading timeline...</div>;
  if (!data?.patient) return <div className="p-6 text-red-500">Patient not found</div>;

  const { patient, timeline, yearDetail } = data;
  const yearData = yearDetail[selectedYear];

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
    currentYearStatus: timeline?.years?.find((y: any) => y.year === timeline.currentYear)?.status || 'ACTIVE',
    aadhaarNo: patient.aadhaarNo ?? MOCK_PATIENTS_MAP[patient.id]?.aadhaarNo,
  };

  const selectedYearMeta = timeline?.years?.find((y: any) => y.year === selectedYear);
  const statusCfg = selectedYearMeta ? statusConfig[selectedYearMeta.status as YearStatus] : null;

  const prevYear = () => {
    const idx = timeline?.years?.findIndex((y: any) => y.year === selectedYear) ?? -1;
    if (idx > 0) setSelectedYear(timeline.years[idx - 1].year);
  };
  const nextYear = () => {
    const idx = timeline?.years?.findIndex((y: any) => y.year === selectedYear) ?? -1;
    if (idx !== -1 && idx < timeline.years.length - 1) setSelectedYear(timeline.years[idx + 1].year);
  };

  const metrics = yearData?.metrics
    ? Object.entries(yearData.metrics as Record<string, unknown>)
    : [];

  return (
    <>
      <PatientHeader patient={patientData} />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold">Health Timeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            A year-by-year view of important health events, changes, and overall status.
          </p>
        </div>

        {/* Timeline + legend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Year-by-Year Overview</CardTitle>
              <YearStatusLegend />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
              <div className="flex-1 min-w-0 overflow-x-auto">
                <YearTimeline
                  years={timeline?.years || []}
                  selectedYear={selectedYear}
                  onSelectYear={setSelectedYear}
                />
              </div>
              
              <div className="w-full lg:w-64 flex-shrink-0 flex flex-col items-center justify-center p-6 border rounded-xl bg-slate-50">
                <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Risk Score</p>
                <div className={cn(
                  "relative flex items-center justify-center h-24 w-24 rounded-full border-[6px] bg-white shadow-sm",
                  timeline?.currentYear === selectedYear 
                    ? 'border-orange-500'
                    : 'border-slate-300'
                )}>
                  <span className="text-3xl font-bold text-slate-800">
                    {timeline?.currentYear === selectedYear ? '63' : '--'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {timeline?.currentYear === selectedYear 
                      ? (statusCfg?.bg?.includes('red') ? 'High risk of acute episode.' 
                         : statusCfg?.bg?.includes('orange') ? 'Elevated risk of deterioration.'
                         : statusCfg?.bg?.includes('yellow') ? 'Moderate monitoring advised.'
                         : 'Low risk. Generally stable.')
                      : 'Score only available for current year.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected year detail */}
        {selectedYearMeta && (
          <div className="space-y-5">
            {/* Year header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={prevYear} disabled={!timeline?.years?.length || selectedYear === timeline.years[0].year}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold">{selectedYear}</h2>
                    {statusCfg && (
                      <StatusBadge status={selectedYearMeta.status as YearStatus} size="lg" />
                    )}
                    {selectedYear === timeline?.currentYear && (
                      <Badge variant="secondary">Current Year</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                    {selectedYearMeta.summary}
                  </p>
                </div>
                <Button variant="outline" size="icon" onClick={nextYear} disabled={!timeline?.years?.length || selectedYear === timeline.years[timeline.years.length - 1].year}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => timeline?.currentYear && setSelectedYear(timeline.currentYear)}>
                Jump to current year
              </Button>
            </div>

            {/* Why this status */}
            {selectedYearMeta.reasons && (
              <div className={cn('rounded-xl border p-4', statusCfg?.bg, statusCfg?.border)}>
                <p className={cn('text-sm font-semibold mb-2 flex items-center gap-2', statusCfg?.text)}>
                  <Info className="h-4 w-4" />
                  Why is {selectedYear} marked {selectedYearMeta.label}?
                </p>
                <ul className="space-y-1">
                  {selectedYearMeta.reasons.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0', statusCfg?.text?.replace('text-', 'bg-'))} />
                      {r}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  This status represents the documented level of health change, not a medical diagnosis.
                </p>
              </div>
            )}

            {/* Year metrics */}
            {yearData?.metrics && metrics.length > 0 && (
              <div>
                <h3 className="text-base font-semibold mb-3">Key Metrics — {selectedYear}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {metrics.map(([key, m]) => {
                    const metric = m as {
                      current: string | number; baseline?: string | number;
                      baselineLabel?: string; change?: number; trend?: string; unit?: string;
                    };
                    return (
                      <HealthMetricCard
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').trim()}
                        current={metric.current}
                        baseline={metric.baseline}
                        baselineLabel={metric.baselineLabel}
                        change={metric.change}
                        trend={metric.trend as 'up' | 'down' | 'neutral'}
                        unit={metric.unit}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Events timeline */}
            {yearData?.events && (
              <div>
                <h3 className="text-base font-semibold mb-3">Events — {selectedYear}</h3>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-3">
                    {(yearData.events as Array<{
                      id: string; type: string; date: string; description: string;
                      reporter?: string; relationship?: string; source: string; status: string; icon: string;
                    }>).map((event) => {
                      const evCfg = eventTypeConfig[event.type] ?? { icon: '•', label: event.type, color: 'text-gray-600' };
                      return (
                        <div key={event.id} className="flex gap-4 items-start">
                          {/* Timeline dot */}
                          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-white flex-shrink-0 text-lg">
                            {event.icon}
                          </div>
                          {/* Content */}
                          <div className="flex-1 rounded-xl border bg-card p-4 card-hover mb-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn('text-xs font-semibold', evCfg.color)}>
                                    {evCfg.label}
                                  </span>
                                  <span className={cn(
                                    'rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
                                    event.status === 'VERIFIED'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  )}>
                                    {event.status === 'VERIFIED' ? '✓ Verified' : 'Reported'}
                                  </span>
                                </div>
                                <p className="text-sm font-medium mt-1">{event.description}</p>
                                {event.reporter && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-medium">{event.reporter}</span>
                                    {event.relationship && ` · ${event.relationship}`}
                                    {' · '}{event.source}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Care Circle reports */}
            {yearData?.careCircleReports && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold">Care Circle Reports</h3>
                  <Link href={`/clinician/patients/${params.patientId}/care-circle`}>
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {(yearData.careCircleReports as Array<{
                    id: string; reporter: string; relationship: string; avatar: string;
                    text: string; date: string; category: string; status: string;
                  }>).map((report) => (
                    <div key={report.id} className="flex gap-4 rounded-xl border bg-card p-4 card-hover">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
                        {report.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{report.reporter}</span>
                          <span className="text-xs text-muted-foreground">—</span>
                          <span className="text-xs text-muted-foreground">{report.relationship}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {new Date(report.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1.5 italic">&ldquo;{report.text}&rdquo;</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{report.category}</Badge>
                          <Badge variant="outline" className="text-xs">Reported Observation</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical takeaways */}
            {yearData?.clinicalTakeaways && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Clinical Takeaways — {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(yearData.clinicalTakeaways as string[]).map((t: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Placeholder for years with no detail */}
            {!yearData && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Detailed year view for {selectedYear} loading…</p>
                  <p className="text-xs mt-1">Connect to the API backend to load historical data.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
