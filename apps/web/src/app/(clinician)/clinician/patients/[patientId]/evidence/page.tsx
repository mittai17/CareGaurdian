'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, PlusCircle, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { demoPatient, demoWhatChanged, demoCareCircle, demoYearDetail, demoYearTimeline } from '@/lib/demo-data';
import { cn, formatDate, timeAgo } from '@/lib/utils';

const evidenceItems = [
  {
    id: 'ev-001',
    claim: 'Medication adherence has decreased significantly',
    detail: 'Adherence dropped from 95% (baseline) to 72% over the past 2 weeks',
    strength: 'Strong',
    sourceType: 'CARE_CIRCLE',
    items: [
      { source: 'Ananya Kumar (Daughter)', date: '2026-09-10', text: 'Dad forgot his evening medicine yesterday.', status: 'REPORTED' },
      { source: 'Latha Reddy (Caregiver)', date: '2026-09-07', text: 'Morning medication was still in the pill box when I arrived.', status: 'REPORTED' },
      { source: 'Medication Log', date: '2026-09-10', text: '72% adherence rate (past 14 days)', status: 'MEASURED' },
    ],
  },
  {
    id: 'ev-002',
    claim: 'Mobility is well below personal baseline',
    detail: '1,950 steps/day vs baseline of 3,100 steps/day — 37% decline',
    strength: 'Strong',
    sourceType: 'CARE_CIRCLE',
    items: [
      { source: 'Meena Iyer (Neighbor)', date: '2026-09-08', text: "He hasn't been taking his normal morning walk all week.", status: 'REPORTED' },
      { source: 'Activity Data', date: '2026-09-10', text: '1,950 avg steps/day (7-day average)', status: 'MEASURED' },
    ],
  },
  {
    id: 'ev-003',
    claim: 'Cognitive observations increased significantly above baseline',
    detail: '4 confusion/memory-related observations in 2 weeks vs rare baseline',
    strength: 'Moderate',
    sourceType: 'CARE_CIRCLE',
    items: [
      { source: 'Ananya Kumar (Daughter)', date: '2026-09-10', text: 'He seemed confused about what day it was.', status: 'REPORTED' },
      { source: 'Suresh Kumar (Son)', date: '2026-09-08', text: 'He repeated the same question about my work three times in 10 minutes.', status: 'REPORTED' },
      { source: 'Rahul Mehta (Friend)', date: '2026-09-09', text: 'He seemed more confused than usual.', status: 'REPORTED' },
    ],
  },
  {
    id: 'ev-004',
    claim: 'Lab results support metabolic concern',
    detail: 'HbA1c 7.8% — above target range. Creatinine mildly elevated.',
    strength: 'Strong',
    sourceType: 'CLINICAL',
    items: [
      { source: 'Clinical Lab', date: '2026-08-20', text: 'HbA1c: 7.8% (target <7.0%). Creatinine: 1.3 mg/dL (upper normal).', status: 'MEASURED' },
    ],
  },
];

const strengthConfig: Record<string, { label: string; color: string }> = {
  Strong: { label: 'Strong Evidence', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Moderate: { label: 'Moderate Evidence', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Weak: { label: 'Weak Evidence', color: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  REPORTED: { label: 'Reported Observation', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  MEASURED: { label: 'Measured', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  VERIFIED: { label: 'Clinically Verified', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function EvidencePage({ params }: { params: { patientId: string } }) {
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  const patient = {
    id: demoPatient.id, firstName: demoPatient.firstName, lastName: demoPatient.lastName,
    dateOfBirth: demoPatient.dateOfBirth, gender: demoPatient.gender,
    primaryDoctor: demoPatient.primaryDoctor, lastClinicalReview: demoPatient.lastClinicalReview,
    careCircleCount: demoPatient.careCircleCount, status: demoPatient.status,
    currentYearStatus: demoYearTimeline.years.find(y => y.year === demoYearTimeline.currentYear)?.status,
  };

  const setFeedback = (id: string, verdict: string) => {
    setFeedbackMap(prev => ({ ...prev, [id]: verdict }));
  };

  return (
    <>
      <PatientHeader patient={patient} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Evidence Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every AI signal has evidence. Review the source, date, and original text behind each finding.
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">About This View</p>
          <p className="text-sm text-blue-700 mt-1">
            AI signals are always linked to their supporting evidence. Original observations are never altered.
            Each item shows its source, status, and confidence level for full transparency.
          </p>
        </div>

        <div className="space-y-5">
          {evidenceItems.map((ev) => {
            const strCfg = strengthConfig[ev.strength] ?? strengthConfig.Moderate;
            const feedback = feedbackMap[ev.id];
            return (
              <Card key={ev.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">AI Signal</h3>
                        <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', strCfg.color)}>
                          {strCfg.label}
                        </span>
                        {feedback && (
                          <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium',
                            feedback === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600'
                          )}>
                            {feedback === 'confirmed' ? '✓ Confirmed' : feedback === 'incorrect' ? '✗ Marked incorrect' : `Monitoring`}
                          </span>
                        )}
                      </div>
                      <p className="text-base font-semibold mt-1">{ev.claim}</p>
                      <p className="text-sm text-muted-foreground">{ev.detail}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Evidence ({ev.items.length} item{ev.items.length > 1 ? 's' : ''})
                  </p>
                  <div className="space-y-3">
                    {ev.items.map((item, i) => {
                      const stCfg = statusConfig[item.status] ?? statusConfig.REPORTED;
                      return (
                        <div key={i} className="rounded-lg border border-border bg-background p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="text-xs font-semibold text-foreground">{item.source}</span>
                                <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-medium', stCfg.color)}>
                                  {stCfg.label}
                                </span>
                              </div>
                              <p className="text-sm text-foreground italic">&ldquo;{item.text}&rdquo;</p>
                            </div>
                            <p className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clinician feedback */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Your feedback on this signal:</p>
                    <div className="flex gap-2 flex-wrap">
                      {['confirmed', 'monitoring', 'not_relevant', 'incorrect'].map((verdict) => (
                        <Button
                          key={verdict}
                          size="sm"
                          variant={feedbackMap[ev.id] === verdict ? 'default' : 'outline'}
                          onClick={() => setFeedback(ev.id, verdict)}
                          className="text-xs"
                        >
                          {verdict === 'confirmed' ? '✓ Confirmed' :
                           verdict === 'monitoring' ? '👁 Monitoring' :
                           verdict === 'not_relevant' ? 'Not Relevant' : '✗ Incorrect'}
                        </Button>
                      ))}
                    </div>
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
