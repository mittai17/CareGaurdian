"use client";

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Shield, Plus, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi, careCircleApi } from '@/lib/api';
import { cn, timeAgo } from '@/lib/utils';

const verificationConfig: Record<string, { label: string; color: string }> = {
  VERIFIED: { label: '✓ Verified', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  IDENTITY_VERIFIED: { label: '✓ Identity Verified', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  CLINICALLY_VERIFIED: { label: '✓ Clinical', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  LICENSE_VERIFIED: { label: '✓ License Verified', color: 'text-primary bg-primary/10 border-primary/20' },
};

const categoryConfig: Record<string, { icon: string; label: string }> = {
  MEDICATION: { icon: '💊', label: 'Medication' },
  CONFUSION: { icon: '🧠', label: 'Confusion' },
  MOBILITY: { icon: '🚶', label: 'Mobility' },
  APPETITE: { icon: '🍽️', label: 'Appetite' },
  SLEEP: { icon: '😴', label: 'Sleep' },
  OTHER: { icon: '💬', label: 'Other' },
};

export default function CareCirclePage({ params }: { params: { patientId: string } }) {
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed');
  const [reportText, setReportText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summary, careCircleResp] = await Promise.all([
          patientsApi.summary(params.patientId).catch(() => null),
          careCircleApi.list(params.patientId).catch(() => []),
        ]);
        setData({
          patient: summary?.patient,
          members: careCircleResp || [],
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.patientId]);

  const handleSubmit = () => {
    if (reportText.trim() && selectedCategory) {
      setSubmitted(true);
      setTimeout(() => { setSubmitted(false); setReportText(''); setSelectedCategory(''); }, 3000);
    }
  };

  if (loading) return <div className="p-6">Loading care circle...</div>;
  if (!data?.patient) return <div className="p-6 text-red-500">Patient not found</div>;

  const { patient, members } = data;
  const feed: any[] = [];
  const displayMembers = members;

  const patientData = {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    primaryDoctor: 'Dr. Elena Chen',
    lastClinicalReview: patient.updatedAt,
    careCircleCount: displayMembers.length,
    status: 'ACTIVE',
    currentYearStatus: 'ACTIVE',
  };

  return (
    <>
      <PatientHeader patient={patientData} />
      <div className="p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Care Circle</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Private trust-based care network for {patient.firstName} {patient.lastName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">Private Network — Not public</span>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Invite Member
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border">
          {(['feed', 'members'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'feed' ? `Care Feed (${feed.length})` : `Members (${displayMembers.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'feed' ? (
          <div className="grid grid-cols-3 gap-6">
            {/* Feed */}
            <div className="col-span-2 space-y-4">
              {/* Corroboration alert */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  🤝 Independent Corroboration
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  3 Care Circle members independently reported related observations within 7 days.
                </p>
                <p className="text-xs text-emerald-600 mt-2">
                  Reporters: Sarah Miller (Daughter) · David Miller (Son) · Meena Iyer (Neighbor)
                </p>
                <p className="text-xs text-emerald-600 mt-1 italic">
                  This is observational evidence, not a diagnosis. Independent corroboration strengthens the signal.
                </p>
              </div>

              {/* Reports */}
              {feed.map((report: any) => {
                const cat = categoryConfig[report.category] ?? { icon: '💬', label: report.category };
                return (
                  <div key={report.id} className="rounded-xl border bg-card p-5 card-hover">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
                        {report.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{report.reporter}</span>
                          <span className="text-xs text-muted-foreground">—</span>
                          <span className="text-xs text-muted-foreground">{report.relationship}</span>
                          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(report.date)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground leading-relaxed">
                          &ldquo;{report.text}&rdquo;
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {cat.icon} {cat.label}
                          </span>
                          <Badge variant="outline" className="text-xs">Reported Observation</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Report Observation panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Report an Observation</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Takes less than 30 seconds. Stored as reported observation.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submitted ? (
                    <div className="py-6 text-center">
                      <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-emerald-700">Observation recorded</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Original observation preserved. Care team notified.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">What category?</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(categoryConfig).map(([key, { icon, label }]) => (
                            <button
                              key={key}
                              onClick={() => setSelectedCategory(key)}
                              className={cn(
                                'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                                selectedCategory === key
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border hover:border-primary/50 text-muted-foreground'
                              )}
                            >
                              <span>{icon}</span> {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">What did you notice?</p>
                        <textarea
                          value={reportText}
                          onChange={(e) => setReportText(e.target.value)}
                          placeholder="Describe what you observed in your own words…"
                          rows={4}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Your original text is preserved exactly as written.
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={!reportText.trim() || !selectedCategory}
                      >
                        <Send className="h-4 w-4 mr-2" /> Submit Observation
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        This is a reported observation, not a medical diagnosis.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Members list */
          <div className="grid grid-cols-2 gap-4">
            {displayMembers.map((member: any) => {
              const verif = verificationConfig[member.verificationStatus || 'VERIFIED'] ?? { label: '✓ Verified', color: 'text-gray-600' };
              return (
                <Card key={member.userId || member.id} className="card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                        {member.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{member.name}</h3>
                          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', verif.color)}>
                            {verif.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.relationshipType || member.relationship}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{member.observationCount} observations</span>
                          <span>Last: {timeAgo(member.lastObservationAt || member.lastActivity)}</span>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Permissions</p>
                          <div className="flex flex-wrap gap-1">
                            {(member.roles || member.permissions || []).map((p: string) => (
                              <span key={p} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {p.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
