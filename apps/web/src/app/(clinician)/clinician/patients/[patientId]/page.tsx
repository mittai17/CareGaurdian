"use client";

import { useEffect, useState } from 'react';
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
import { patientsApi, changesApi, careCircleApi, contradictionsApi, missingInfoApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { cn, getAge } from '@/lib/utils';

interface PageProps {
  params: { patientId: string };
}

export default function PatientOverviewPage({ params }: PageProps) {
  const defaultPatient = MOCK_PATIENTS_MAP[params.patientId] || {
    id: params.patientId,
    firstName: 'Devaki',
    lastName: 'Sundaram',
    dateOfBirth: '1954-03-12',
    gender: 'Female',
  };

  const [data, setData] = useState<any>({
    patient: defaultPatient,
    summary: {
      primaryDoctor: 'Dr. Vikram Malhotra',
      currentYearStatus: 'WATCH',
      lastReviewDate: new Date().toISOString(),
    },
    changes: null,
    careCircle: [
      { id: '1', role: 'FAMILY_CAREGIVER', user: { name: 'Karthik Sundaram', role: 'FAMILY_CAREGIVER' } },
      { id: '2', role: 'PRIMARY_CLINICIAN', user: { name: 'Dr. Vikram Malhotra', role: 'CLINICIAN' } },
    ],
    contradictions: [],
    missingInfo: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          summary,
          changesResp,
          careCircle,
          contradictions,
          missingInfo
        ] = await Promise.all([
          patientsApi.summary(params.patientId).catch(() => null),
          changesApi.whatChanged(params.patientId).catch(() => null),
          careCircleApi.list(params.patientId).catch(() => []),
          contradictionsApi.list(params.patientId).catch(() => []),
          missingInfoApi.list(params.patientId).catch(() => []),
        ]);

        const fallbackPatient = MOCK_PATIENTS_MAP[params.patientId] || {
          id: params.patientId,
          firstName: 'Devaki',
          lastName: 'Sundaram',
          dateOfBirth: '1954-03-12',
          gender: 'Female',
        };

        setData({
          patient: summary?.patient || fallbackPatient,
          summary: summary?.summary || {
            primaryDoctor: 'Dr. Vikram Malhotra',
            currentYearStatus: 'WATCH',
            lastReviewDate: new Date().toISOString(),
          },
          changes: changesResp ?? null,
          careCircle: careCircle && careCircle.length > 0 ? careCircle : [
            { id: '1', role: 'FAMILY_CAREGIVER', user: { name: 'Karthik Sundaram', role: 'FAMILY_CAREGIVER' } },
            { id: '2', role: 'PRIMARY_CLINICIAN', user: { name: 'Dr. Vikram Malhotra', role: 'CLINICIAN' } }
          ],
          contradictions: (contradictions || []).filter((c: any) => c.status === 'OPEN'),
          missingInfo: (missingInfo || []).filter((m: any) => m.status === 'OPEN'),
        });
      } catch (e) {
        console.error(e);
        const fallbackPatient = MOCK_PATIENTS_MAP[params.patientId] || {
          id: params.patientId,
          firstName: 'Devaki',
          lastName: 'Sundaram',
          dateOfBirth: '1954-03-12',
          gender: 'Female',
        };
        setData({
          patient: fallbackPatient,
          summary: {
            primaryDoctor: 'Dr. Vikram Malhotra',
            currentYearStatus: 'WATCH',
            lastReviewDate: new Date().toISOString(),
          },
          changes: null,
          careCircle: [
            { id: '1', role: 'FAMILY_CAREGIVER', user: { name: 'Karthik Sundaram', role: 'FAMILY_CAREGIVER' } },
            { id: '2', role: 'PRIMARY_CLINICIAN', user: { name: 'Dr. Vikram Malhotra', role: 'CLINICIAN' } }
          ],
          contradictions: [],
          missingInfo: [],
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.patientId]);

  if (loading) return <div className="p-6">Loading patient data...</div>;
  if (!data?.patient) return <div className="p-6 text-red-500">Patient not found</div>;

  const { patient, summary, careCircle, contradictions, missingInfo, changes } = data;

  const patientData = {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    primaryDoctor: summary?.primaryDoctor || 'Assigned Clinician',
    lastClinicalReview: patient.updatedAt,
    careCircleCount: careCircle.length,
    status: 'ACTIVE',
    currentYearStatus: 'ACTIVE',
  };

  const basePath = `/clinician/patients/${patient.id}`;

  return (
    <>
      <PatientHeader patient={patientData} />
      <div className="p-6 space-y-6 animate-fade-in">
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
                {changes?.changes?.map((change: any) => (
                  <div
                    key={change.id}
                    className="flex items-start gap-4 rounded-xl border bg-card p-4 card-hover"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 flex-shrink-0 text-base">
                      {change.icon || '📊'}
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
                    </div>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No significant changes detected.</p>}
              </div>
            </div>

            {/* Why Now */}
            {changes?.whyNow && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Why is this showing now?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {changes.whyNow.map((reason: string, i: number) => (
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
                  {changes.disclaimer && (
                    <p className="mt-3 text-xs text-muted-foreground italic">{changes.disclaimer}</p>
                  )}
                </CardContent>
              </Card>
            )}

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
                <p className="text-sm text-muted-foreground">View the full health timeline for this patient.</p>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                  <Link href={`${basePath}/timeline`}>Open Timeline</Link>
                </Button>
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
                {careCircle.slice(0, 4).map((member: any, i: number) => {
                  const displayName = member.name || member.user?.name || `Caregiver ${i + 1}`;
                  const relationship = member.relationshipType || member.role || 'Care Team';
                  const obs = member.observationCount ?? 12;
                  return (
                    <div key={member.userId || member.id || i} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                        {displayName[0] || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{relationship}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{obs} obs.</p>
                      </div>
                    </div>
                  );
                })}
                <Link href={`${basePath}/care-circle`} className="flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                  View full care circle <ArrowRight className="h-3 w-3" />
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
                  {contradictions.map((c: any) => (
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
                    {missingInfo.slice(0, 3).map((m: any) => (
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
