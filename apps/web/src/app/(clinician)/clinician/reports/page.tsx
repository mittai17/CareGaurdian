'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Activity,
  Download,
  Printer,
  Calendar,
  User,
  Filter,
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Clock,
  Eye,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { patientsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface ClinicalReport {
  id: string;
  title: string;
  reportType: 'LONGITUDINAL_BRIEF' | 'BASELINE_DRIFT' | 'MED_RECONCILIATION' | 'CARE_CIRCLE_DOSSIER' | 'ANOMALY_AUDIT';
  patientId: string;
  patientName: string;
  age: number;
  period: string;
  generatedDate: string;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'STABLE';
  summary: string;
  keyFindings: string[];
  clinicianNotes: string;
  signedOff: boolean;
  signedBy?: string;
}

const initialReports: ClinicalReport[] = [
  {
    id: 'rep-001',
    title: 'Comprehensive Longitudinal Brief — Ravi Kumar',
    reportType: 'LONGITUDINAL_BRIEF',
    patientId: '66c67bf7-f6e3-478e-b972-20d7d25b4958',
    patientName: 'Ravi Kumar',
    age: 74,
    period: 'Aug 1, 2026 – Sep 10, 2026',
    generatedDate: '2026-09-10',
    riskLevel: 'HIGH',
    summary: 'Detected 35% decline in daily walking pace and acute Penicillin-family contradiction alert. Caregiver logs note two minor balance perturbations.',
    keyFindings: [
      'Contradiction detected: Amoxicillin prescribed despite documented Penicillin allergy.',
      'Gait speed down from 0.92 m/s baseline to 0.61 m/s.',
      'Hydration intake reported deficient on 4 of last 7 days.',
      'Care Circle engagement active: 14 caregiver observations logged this month.',
    ],
    clinicianNotes: 'Requires immediate medication discontinuation and in-clinic physical therapy referral.',
    signedOff: false,
  },
  {
    id: 'rep-002',
    title: 'Baseline Drift & Health Memory Trajectory — Lakshmi Raghavan',
    reportType: 'BASELINE_DRIFT',
    patientId: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
    patientName: 'Lakshmi Raghavan',
    age: 68,
    period: 'Jul 1, 2026 – Sep 10, 2026',
    generatedDate: '2026-09-09',
    riskLevel: 'MODERATE',
    summary: 'Systolic blood pressure baseline has drifted upward by 14 mmHg over past 60 days. Night-time sleep fragmentation increased by 40%.',
    keyFindings: [
      'Blood pressure averages 146/88 mmHg vs historical baseline of 132/80 mmHg.',
      'Sleep onset latency lengthened; family notes wandering episodes between 1:00 AM - 3:00 AM.',
      'Cognitive screening MMSE score remains stable at 26/30.',
    ],
    clinicianNotes: 'Adjusting antihypertensive therapy; scheduled sleep hygiene consultation.',
    signedOff: true,
    signedBy: 'Dr. Priya Sharma',
  },
  {
    id: 'rep-003',
    title: 'Medication Reconciliation & Conflict Audit — Mohan Pillai',
    reportType: 'MED_RECONCILIATION',
    patientId: '3489a162-e878-493a-92e3-ad33476afc55',
    patientName: 'Mohan Pillai',
    age: 72,
    period: 'Past 90 Days',
    generatedDate: '2026-09-08',
    riskLevel: 'STABLE',
    summary: 'Reconciled 6 active prescriptions. No drug-drug interactions or duplicated therapies detected.',
    keyFindings: [
      'Inhaler compliance verified at 88% via pharmacy claims data.',
      'Serum creatinine and BUN within normal limits.',
      'No adverse drug reactions reported by care circle.',
    ],
    clinicianNotes: 'Prescriptions renewed for 90 days. Next review scheduled for December 2026.',
    signedOff: true,
    signedBy: 'Dr. Priya Sharma',
  },
  {
    id: 'rep-004',
    title: 'Monthly Care Circle Dossier — Sunita Balasubramanian',
    reportType: 'CARE_CIRCLE_DOSSIER',
    patientId: '33ec2506-2cfd-437d-8c66-defd67159f29',
    patientName: 'Sunita Balasubramanian',
    age: 71,
    period: 'Aug 1, 2026 – Aug 31, 2026',
    generatedDate: '2026-09-01',
    riskLevel: 'LOW',
    summary: 'Monthly family summary covering dietary compliance, joint pain scores, and physical activity logs.',
    keyFindings: [
      'Average daily steps: 3,420 (95% of target).',
      'Pain scores consistently rated 2/10 or below with physical therapy.',
      'Daughter logged zero missed medication doses.',
    ],
    clinicianNotes: 'Excellent family support and lifestyle maintenance.',
    signedOff: true,
    signedBy: 'Dr. Arjun Nair',
  },
  {
    id: 'rep-005',
    title: 'Cognitive & Neuro-Motor Anomaly Audit — Krishnamurthy Swaminathan',
    reportType: 'ANOMALY_AUDIT',
    patientId: '5b29040a-ea76-4cf3-9d2c-f63c70fcd419',
    patientName: 'Krishnamurthy Swaminathan',
    age: 79,
    period: 'Past 30 Days',
    generatedDate: '2026-09-07',
    riskLevel: 'HIGH',
    summary: 'Memory retrieval latency increased. Multiple caregiver reports of word-finding difficulty and disorientation in familiar surroundings.',
    keyFindings: [
      'Speech pause frequency increased by 28% in caregiver audio check-ins.',
      'Evening sundowning symptoms reported 4 evenings in past 2 weeks.',
      'Appetite reduced by ~20% during evening meals.',
    ],
    clinicianNotes: 'Neurology consult requested. Safety measures implemented in home environment.',
    signedOff: false,
  },
];

const reportTypeConfig = {
  LONGITUDINAL_BRIEF: { label: 'Longitudinal Brief', color: 'text-blue-600', bg: 'bg-blue-50' },
  BASELINE_DRIFT: { label: 'Baseline Drift Analysis', color: 'text-purple-600', bg: 'bg-purple-50' },
  MED_RECONCILIATION: { label: 'Med Reconciliation', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  CARE_CIRCLE_DOSSIER: { label: 'Care Circle Dossier', color: 'text-amber-600', bg: 'bg-amber-50' },
  ANOMALY_AUDIT: { label: 'Anomaly Audit', color: 'text-rose-600', bg: 'bg-rose-50' },
};

const riskConfig = {
  HIGH: { label: 'High Risk / Action Needed', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  MODERATE: { label: 'Moderate Drift', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  LOW: { label: 'Low Risk', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  STABLE: { label: 'Stable Baseline', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

export default function ClinicianReportsPage() {
  const [reports, setReports] = useState<ClinicalReport[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baseline_clinician_reports');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return initialReports;
  });

  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [activeReportModal, setActiveReportModal] = useState<ClinicalReport | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // New report generator form state
  const [genPatientName, setGenPatientName] = useState('Lakshmi Raghavan');
  const [genPatientId, setGenPatientId] = useState('eaf97dad-41d4-4e48-a345-5f1d3f0f5380');
  const [genType, setGenType] = useState<ClinicalReport['reportType']>('LONGITUDINAL_BRIEF');
  const [genPeriod, setGenPeriod] = useState('Past 30 Days');
  const [includeAI, setIncludeAI] = useState(true);
  const [includeCareCircle, setIncludeCareCircle] = useState(true);

  // Fetch patients
  useEffect(() => {
    patientsApi
      .list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
          const first = data[0];
          setGenPatientId(first.id);
          setGenPatientName(first.fullName || first.name || 'Lakshmi Raghavan');
        }
      })
      .catch((err) => console.warn('Patients API failed:', err));
  }, []);

  // Save to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('baseline_clinician_reports', JSON.stringify(reports));
    }
  }, [reports]);

  const handleSignOff = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, signedOff: true, signedBy: 'Dr. Priya Sharma' }
          : r
      )
    );
    if (activeReportModal && activeReportModal.id === reportId) {
      setActiveReportModal((prev) =>
        prev ? { ...prev, signedOff: true, signedBy: 'Dr. Priya Sharma' } : null
      );
    }
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();

    const newReport: ClinicalReport = {
      id: `rep-${Date.now()}`,
      title: `${reportTypeConfig[genType].label} — ${genPatientName}`,
      reportType: genType,
      patientId: genPatientId,
      patientName: genPatientName,
      age: 70,
      period: genPeriod,
      generatedDate: new Date().toISOString().split('T')[0],
      riskLevel: 'MODERATE',
      summary: `Automated ${reportTypeConfig[genType].label.toLowerCase()} generated via AI baseline analysis. Trajectory and observations compiled for ${genPatientName}.`,
      keyFindings: [
        'Baseline vital trajectory evaluated over requested timeframe.',
        'Care Circle feed aggregated with 0 unverified contradictions.',
        'Longitudinal memory models updated with latest clinical observations.',
      ],
      clinicianNotes: 'Draft generated for clinical review and sign-off.',
      signedOff: false,
    };

    setReports((prev) => [newReport, ...prev]);
    setShowGenerateModal(false);
    setActiveReportModal(newReport);
  };

  // KPIs
  const totalReports = reports.length;
  const highRiskCount = reports.filter((r) => r.riskLevel === 'HIGH').length;
  const pendingSignoff = reports.filter((r) => !r.signedOff).length;
  const signedOffCount = reports.filter((r) => r.signedOff).length;

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          rep.title.toLowerCase().includes(q) ||
          rep.patientName.toLowerCase().includes(q) ||
          rep.summary.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedType !== 'ALL' && rep.reportType !== selectedType) {
        return false;
      }
      if (selectedRisk !== 'ALL' && rep.riskLevel !== selectedRisk) {
        return false;
      }
      return true;
    });
  }, [reports, searchQuery, selectedType, selectedRisk]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clinical Intelligence Reports</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              Health Memory Analytics
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Longitudinal briefs, baseline drift audits, and AI-synthesized health memory dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Generate New Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{totalReports}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">High Risk Trajectories</p>
                <p className="text-2xl font-bold text-rose-600 mt-0.5">{highRiskCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Awaiting Sign-off</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingSignoff}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Signed & Finalized</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{signedOffCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border">
        <CardContent className="py-3 px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports by title, patient, or findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-1.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Report Types</option>
                <option value="LONGITUDINAL_BRIEF">Longitudinal Briefs</option>
                <option value="BASELINE_DRIFT">Baseline Drift Audits</option>
                <option value="MED_RECONCILIATION">Med Reconciliation</option>
                <option value="CARE_CIRCLE_DOSSIER">Care Circle Dossiers</option>
                <option value="ANOMALY_AUDIT">Anomaly Audits</option>
              </select>

              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MODERATE">Moderate Drift</option>
                <option value="LOW">Low Risk</option>
                <option value="STABLE">Stable Baseline</option>
              </select>

              {(selectedType !== 'ALL' || selectedRisk !== 'ALL' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedType('ALL');
                    setSelectedRisk('ALL');
                    setSearchQuery('');
                  }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((report) => {
          const typeMeta = reportTypeConfig[report.reportType] || reportTypeConfig.LONGITUDINAL_BRIEF;
          const riskMeta = riskConfig[report.riskLevel] || riskConfig.STABLE;

          return (
            <Card key={report.id} className="border-border flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded', typeMeta.bg, typeMeta.color)}>
                      {typeMeta.label}
                    </span>
                    <h3 className="text-base font-semibold text-foreground mt-1.5 line-clamp-1">
                      {report.title}
                    </h3>
                  </div>

                  <Badge variant="outline" className={cn('text-[11px] font-semibold flex-shrink-0', riskMeta.badge)}>
                    {riskMeta.label}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {report.summary}
                </p>

                <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide">Key Findings</p>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    {report.keyFindings.slice(0, 2).map((k, i) => (
                      <li key={i} className="line-clamp-1">{k}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground">{report.patientName}</span>
                    <span>• {report.period}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {report.signedOff ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-[11px]">
                        <Clock className="h-3.5 w-3.5" /> Draft
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveReportModal(report)}
                    className="flex-1 text-xs gap-1.5 h-8"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Clinical Brief
                  </Button>

                  <Link href={`/clinician/patients/${report.patientId}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full text-xs gap-1 h-8 text-primary">
                      Patient Dossier <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Preview Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-border max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {activeReportModal.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Generated on {activeReportModal.generatedDate} • {activeReportModal.period}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {activeReportModal.patientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{activeReportModal.patientName}</p>
                    <p className="text-xs text-muted-foreground">Age {activeReportModal.age} • Patient ID: {activeReportModal.patientId.slice(0, 8)}</p>
                  </div>
                </div>

                <Badge variant="outline" className={cn('text-xs font-semibold', riskConfig[activeReportModal.riskLevel].badge)}>
                  {riskConfig[activeReportModal.riskLevel].label}
                </Badge>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Executive Clinical Summary
                </h4>
                <p className="text-foreground leading-relaxed bg-muted/10 p-3 rounded-lg border border-border">
                  {activeReportModal.summary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Key Observations & Evidence
                </h4>
                <ul className="space-y-2">
                  {activeReportModal.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-foreground">
                      <span className="text-primary font-bold">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Clinician Review Notes
                </h4>
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-amber-900 text-xs">
                  {activeReportModal.clinicianNotes}
                </div>
              </div>

              {activeReportModal.signedOff && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-xs font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Clinically signed and validated by {activeReportModal.signedBy || 'Dr. Priya Sharma'}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Exporting PDF for ${activeReportModal.patientName}...`)}
                  className="text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {!activeReportModal.signedOff && (
                  <Button
                    size="sm"
                    onClick={() => handleSignOff(activeReportModal.id)}
                    className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sign Off Report
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setActiveReportModal(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Generate Clinical Intelligence Report
              </h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Patient
                </label>
                <select
                  value={genPatientName}
                  onChange={(e) => {
                    setGenPatientName(e.target.value);
                    const p = patients.find((item) => (item.fullName || item.name) === e.target.value);
                    if (p) setGenPatientId(p.id);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Lakshmi Raghavan">Lakshmi Raghavan</option>
                  <option value="Mohan Pillai">Mohan Pillai</option>
                  <option value="Kamala Venkatesh">Kamala Venkatesh</option>
                  <option value="Ravi Kumar">Ravi Kumar</option>
                  <option value="Sunita Balasubramanian">Sunita Balasubramanian</option>
                  <option value="Krishnamurthy Swaminathan">Krishnamurthy Swaminathan</option>
                  <option value="Padmanabhan Nambiar">Padmanabhan Nambiar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Report Type
                </label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as any)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="LONGITUDINAL_BRIEF">Comprehensive Longitudinal Brief</option>
                  <option value="BASELINE_DRIFT">Baseline Trajectory & Drift Audit</option>
                  <option value="MED_RECONCILIATION">Medication Reconciliation & Conflict Check</option>
                  <option value="CARE_CIRCLE_DOSSIER">Monthly Care Circle Dossier</option>
                  <option value="ANOMALY_AUDIT">Cognitive & Neuro-Motor Anomaly Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Timeframe
                </label>
                <select
                  value={genPeriod}
                  onChange={(e) => setGenPeriod(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Past 30 Days">Past 30 Days</option>
                  <option value="Past 90 Days">Past 90 Days</option>
                  <option value="Past 6 Months">Past 6 Months</option>
                  <option value="Full Historical Year">Full Historical Year</option>
                </select>
              </div>

              <div className="space-y-2 pt-1 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={includeAI}
                    onChange={(e) => setIncludeAI(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <span>Include AI Trajectory Drift Predictions & Anomaly Scores</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={includeCareCircle}
                    onChange={(e) => setIncludeCareCircle(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <span>Incorporate Care Circle Observations & Daily Carer Check-ins</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Generate Dossier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
