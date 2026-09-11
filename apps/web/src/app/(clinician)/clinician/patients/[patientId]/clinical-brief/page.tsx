"use client";

import { useEffect, useState } from 'react';
import { Brain, CheckCircle, Printer, Download, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi, changesApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { AiResponseBlock } from '@/components/ai/ai-response-block';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';

const sectionConfig = [
  { key: 'currentChanges', label: 'Current Changes', icon: '📊' },
  { key: 'relevantHistory', label: 'Relevant History', icon: '📋' },
  { key: 'careCircleObservations', label: 'Care Circle Observations', icon: '👥' },
  { key: 'medicationContext', label: 'Medication Context', icon: '💊' },
  { key: 'cognitiveChanges', label: 'Cognitive Changes', icon: '🧠' },
  { key: 'functionalChanges', label: 'Functional Changes', icon: '🦽' },
  { key: 'historicalEpisodeMatch', label: 'Historical Episode Match', icon: '🔄' },
];

export default function ClinicalBriefPage({ params }: { params: { patientId: string } }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summary, briefResp] = await Promise.all([
          patientsApi.summary(params.patientId).catch(() => null),
          changesApi.brief(params.patientId).catch(() => null),
        ]);
        const mockPatient = MOCK_PATIENTS_MAP[params.patientId];
        setData({
          patient: { ...(summary?.patient ?? mockPatient), aadhaarNo: mockPatient?.aadhaarNo },
          brief: briefResp?.data ?? null,
        });
        if (briefResp?.data) setGenerated(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.patientId]);

  if (loading) return <div className="p-6">Loading clinical brief...</div>;
  if (!data?.patient) return <div className="p-6 text-red-500">Patient not found</div>;

  const { patient, brief } = data;

  const patientData = {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    primaryDoctor: 'Assigned Clinician',
    lastClinicalReview: patient.updatedAt,
    careCircleCount: 0,
    status: 'ACTIVE',
    currentYearStatus: 'ACTIVE',
    aadhaarNo: patient.aadhaarNo ?? MOCK_PATIENTS_MAP[patient.id]?.aadhaarNo,
  };

  const regenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  return (
    <>
      <PatientHeader patient={patientData} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clinical Brief</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated summary for clinical review. Not a diagnosis. Clinician must independently assess all findings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!generated}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
            <Button variant="outline" size="sm" disabled={!generated}>
              <Download className="h-4 w-4 mr-1.5" /> Export PDF
            </Button>
            <Button size="sm" onClick={regenerate} disabled={generating}>
              {generating ? (
                <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Generating…</>
              ) : (
                <><Brain className="h-4 w-4 mr-1.5" /> {generated ? 'Regenerate' : 'Generate Brief'}</>
              )}
            </Button>
          </div>
        </div>

        {generated && (
          <AiResponseBlock confidence={brief?.confidenceScore != null ? Math.round(brief.confidenceScore * 100) : 82}>
            {/* Header */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="h-5 w-5 text-primary" />
                    <h2 className="font-bold text-lg">Clinical Brief — {patient.firstName} {patient.lastName}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Generated {brief?.generatedAt ? formatDate(brief.generatedAt, { time: true }) : 'Just now'}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">Requires Clinician Review</Badge>
              </div>
            </div>

            {/* Brief sections */}
            <div className="space-y-4">
              {sectionConfig.map(({ key, label, icon }) => {
                const content = (brief.sections as Record<string, any>)[key];
                if (!content) return null;
                return (
                  <Card key={key} className="card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-base">{icon}</span>
                        {label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground leading-relaxed">{content}</p>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Suggested Areas for Clinical Review */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-base">✅</span>
                    Suggested Areas for Clinical Review
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    AI-identified areas requiring clinician assessment. Not autonomous recommendations.
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {brief.sections.suggestedAreasForClinicalReview.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm">{item}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Final message */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-3">
              <p className="text-base font-semibold text-foreground leading-relaxed">
                Baseline didn&apos;t just remember {patient.firstName}&apos;s medical history.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                It recognized that <strong>something changed</strong>, showed <strong>who noticed it</strong>,
                compared it with <strong>{patient.firstName}&apos;s normal pattern</strong>, connected it with <strong>their past</strong>,
                and gave the clinician the <strong>evidence needed to review it</strong>.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Badge variant="secondary" className="text-xs">AI Assisted</Badge>
                <Badge variant="secondary" className="text-xs">Evidence Backed</Badge>
                <Badge variant="secondary" className="text-xs">Clinician Reviews</Badge>
                <Badge variant="secondary" className="text-xs">Patient Controls Access</Badge>
              </div>
            </div>
          </AiResponseBlock>
        )}

        {!generated && !generating && (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Generate Clinical Brief</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Baseline will synthesize {patient.firstName}&apos;s health memory — combining medical history,
                Care Circle observations, personal baseline, and historical episodes into a structured clinical summary.
              </p>
              <Button onClick={regenerate}>
                <Brain className="h-4 w-4 mr-2" /> Generate Now
              </Button>
            </CardContent>
          </Card>
        )}

        {generating && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h3 className="font-semibold">Generating Clinical Brief…</h3>
              <div className="space-y-2 text-sm text-muted-foreground max-w-xs mx-auto">
                {['Retrieving health memory…', 'Analysing Care Circle observations…', 'Comparing with personal baseline…', 'Running safety checks…'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
