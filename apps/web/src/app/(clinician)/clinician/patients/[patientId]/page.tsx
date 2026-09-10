import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingDown, TrendingUp, AlertTriangle, Users, ArrowRight,
  MessageSquare, Brain, Activity, Clock, Pill, CheckSquare, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientHeader } from '@/components/patient/patient-header';
import { HealthMetricCard } from '@/components/health/health-metric-card';
import {
  demoPatient, demoWhatChanged, demoCareCircle, demoYearTimeline,
  demoContradictions, demoMissingInfo, DEMO_PATIENT_ID,
} from '@/lib/demo-data';
import { cn, formatDate, timeAgo } from '@/lib/utils';

interface PageProps {
  params: { patientId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const isDemo = params.patientId === DEMO_PATIENT_ID;
  if (isDemo) return { title: 'Ravi Kumar — Overview' };
  return { title: 'Patient Overview' };
}

export default function PatientOverviewPage({ params }: PageProps) {
  const patient = demoPatient; // In production: fetch by params.patientId
  const changes = demoWhatChanged;
  const careCircle = demoCareCircle;
  const timeline = demoYearTimeline;
  const currentYear = timeline.years.find((y) => y.year === timeline.currentYear);
  const contradictions = demoContradictions.filter((c) => c.status === 'OPEN');
  const missingInfo = demoMissingInfo.filter((m) => m.status === 'OPEN');

  const patientData = {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    primaryDoctor: patient.primaryDoctor,
    lastClinicalReview: patient.lastClinicalReview,
    careCircleCount: patient.careCircleCount,
    status: patient.status,
    currentYearStatus: currentYear?.status,
  };

  const basePath = `/clinician/patients/${patient.id}`;

  return (
    <>
      <PatientHeader patient={patientData} />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Demo banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 flex items-center gap-3">
          <span className="text-blue-600 text-xs font-semibold uppercase tracking-wide">🔬 Synthetic Demo</span>
          <p className="text-blue-700 text-sm">
            {patient._disclaimer} —{' '}
            <Link href={`${basePath}/clinical-brief`} className="underline font-medium">Generate Clinical Brief →</Link>
          </p>
        </div>

        {/* Current Status section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Current Status</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href={`${basePath}/baseline`}>View Personal Baseline <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <HealthMetricCard
              label="Medication Adherence"
              current="72%"
              baseline="95%"
              baselineLabel="95%"
              change={-23}
              trend="down"
            />
            <HealthMetricCard
              label="Daily Mobility"
              current="1,950"
              baseline="3,100"
              baselineLabel="3,100 steps/day"
              unit="steps"
              change={-37}
              trend="down"
            />
            <HealthMetricCard
              label="Appetite"
              current="Reduced"
              baseline="Normal"
              baselineLabel="Normal"
              trend="down"
              change={null}
            />
            <HealthMetricCard
              label="Confusion Reports"
              current={4}
              baselineLabel="Rare"
              trend="up"
              invertTrend={true}
              unit="reports (2 wks)"
              change={null}
            />
            <HealthMetricCard
              label="Sleep Duration"
              current="5.4 hrs"
              baselineLabel="7 hrs"
              change={-23}
              trend="down"
            />
            <HealthMetricCard
              label="Functional Status"
              current="Needs support"
              baselineLabel="Independent"
              trend="down"
              change={null}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* What Changed */}
          <div className="col-span-2 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">What Changed?</h2>
                  <p className="text-xs text-muted-foreground">AI-detected meaningful deviations from personal baseline</p>
                </div>
                <Link href={`${basePath}/evidence`}>
                  <Button variant="ghost" size="sm">View Evidence <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
                </Link>
              </div>

              <div className="space-y-2">
                {changes.changes.map((change, i) => (
                  <div
                    key={change.id}
                    className="flex items-start gap-4 rounded-xl border bg-card p-4 card-hover"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 flex-shrink-0 text-base">
                      {change.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{change.title}</p>
                        <span className={cn(
                          'rounded-full border px-2 py-0.5 text-xs font-medium flex-shrink-0',
                          change.severity === 'CONCERN'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        )}>
                          {change.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{change.detail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {change.evidenceCount} supporting evidence item{change.evidenceCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Now */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Why is this showing now?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {changes.whyNow.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
                {changes.corroboration && (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm font-semibold text-emerald-800">
                      🤝 {changes.corroboration.label}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">{changes.corroboration.description}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {changes.corroboration.reporters.join(' · ')}
                    </p>
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground italic">{changes.disclaimer}</p>
              </CardContent>
            </Card>

            {/* Timeline quick preview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Health Timeline
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`${basePath}/timeline`}>Full Timeline <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {timeline.years.map((y) => {
                    const colorMap: Record<string, string> = {
                      GOOD: '#10b981', STABLE: '#84cc16', WATCH: '#eab308', CONCERN: '#f97316', CRITICAL: '#ef4444',
                    };
                    const emoji: Record<string, string> = {
                      GOOD: '🟢', STABLE: '🟢', WATCH: '🟡', CONCERN: '🟠', CRITICAL: '🔴',
                    };
                    const isCurrentYear = y.year === timeline.currentYear;
                    return (
                      <Link key={y.year} href={`${basePath}/timeline`} className="flex flex-col items-center gap-1 px-2 flex-shrink-0 group">
                        <span className="text-base">{emoji[y.status]}</span>
                        <span className={cn('text-xs font-semibold', isCurrentYear ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground transition-colors')}>{y.year}</span>
                        <span className="text-[10px] text-muted-foreground">{y.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Care Circle */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Care Circle
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs" asChild>
                    <Link href={`${basePath}/care-circle`}>View all</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {careCircle.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                      {member.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.relationship}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{member.observationCount} obs.</p>
                    </div>
                  </div>
                ))}
                <Link href={`${basePath}/care-circle`} className="flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                  +{careCircle.length - 4} more members <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            {/* Contradictions alert */}
            {contradictions.length > 0 && (
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    {contradictions.length} Record Conflict{contradictions.length > 1 ? 's' : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contradictions.map((c) => (
                    <div key={c.id} className="rounded-lg bg-red-50 border border-red-100 p-3">
                      <p className="text-xs font-medium text-red-800">{c.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-red-700 mt-0.5 line-clamp-2">{c.description}</p>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full border-red-200 text-red-700 hover:bg-red-50" asChild>
                    <Link href={`${basePath}/contradictions`}>Review Conflicts</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Missing info */}
            {missingInfo.length > 0 && (
              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-700">
                    <Info className="h-4 w-4" />
                    {missingInfo.length} Information Gap{missingInfo.length > 1 ? 's' : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {missingInfo.slice(0, 3).map((m) => (
                      <li key={m.id} className="text-xs text-yellow-800 flex items-start gap-1.5">
                        <span className="mt-1 h-1 w-1 rounded-full bg-yellow-600 flex-shrink-0" />
                        {m.description}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-3 border-yellow-200 text-yellow-700 hover:bg-yellow-50" asChild>
                    <Link href={`${basePath}/missing-information`}>View Gaps</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { href: `${basePath}/clinical-brief`, icon: Brain, label: 'Generate Clinical Brief' },
                  { href: `${basePath}/timeline`, icon: Activity, label: 'View Health Timeline' },
                  { href: `${basePath}/episodes`, icon: CheckSquare, label: 'Episode Comparison' },
                  { href: `${basePath}/evidence`, icon: Info, label: 'Explore Evidence' },
                ].map(({ href, icon: Icon, label }) => (
                  <Button key={href} variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                    <Link href={href}><Icon className="h-3.5 w-3.5" />{label}</Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
