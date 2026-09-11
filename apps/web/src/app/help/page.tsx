'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  BookOpen,
  Shield,
  Activity,
  Heart,
  AlertTriangle,
  FileQuestion,
  PhoneCall,
  Mail,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categories = [
  {
    icon: BookOpen,
    title: 'Getting Started with Baseline',
    desc: 'Learn the core concepts of persistent health memory and trajectory modeling.',
    articles: [
      'What is persistent health memory vs traditional EHR?',
      'Navigating the clinician dashboard and patient rosters',
      'Understanding patient baseline calibration periods',
    ],
  },
  {
    icon: Activity,
    title: 'Clinical Decision & Trajectory AI',
    desc: 'How change detection, drift scores, and anomaly alerts are computed.',
    articles: [
      'Interpreting trajectory shift vs daily variance',
      'How AI identifies medication contradictions',
      'Evidence citation and medical graph grounding',
    ],
  },
  {
    icon: Heart,
    title: 'Care Circle Management',
    desc: 'Collaborating with family members, professional caregivers, and guardians.',
    articles: [
      'Inviting family caregivers to patient care circle',
      'Setting observation report permissions and visibility',
      'Reviewing caregiver voice logs and daily check-ins',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Emergency & Acute Escalations',
    desc: 'Crisis triggers, sudden decline alerts, and rapid intervention protocols.',
    articles: [
      'Configuring critical alert thresholds for falls and confusion',
      'Multi-channel emergency notifications (SMS, App, Phone)',
      'Documenting acute episode resolutions',
    ],
  },
  {
    icon: Shield,
    title: 'Security, HIPAA & Patient Consent',
    desc: 'End-to-end data encryption, audit trails, and healthcare compliance.',
    articles: [
      'HIPAA and DISHA compliance standards in Baseline',
      'Audit log access and clinician activity tracking',
      'Revoking caregiver consent or modifying guardians',
    ],
  },
  {
    icon: FileQuestion,
    title: 'Integrations & Medical Devices',
    desc: 'Connecting smart monitors, pharmacy claims, and laboratory feeds.',
    articles: [
      'Pairing Bluetooth blood pressure and pulse oximeters',
      'Syncing lab result feeds and FHIR interfaces',
      'Exporting longitudinal briefs to external hospital systems',
    ],
  },
];

const faqs = [
  {
    q: 'How does Baseline detect when a patient is deviating from their personal baseline?',
    a: 'Baseline builds a personalized multidimensional baseline over 60–90 days encompassing vitals, sleep continuity, gait/mobility pace, cognitive conversational markers, and appetite. When a cumulative 7-day or 14-day rolling vector drifts beyond 2 standard deviations of that individual patient’s baseline, an anomaly alert is flagged with citations to specific caregiver observations.',
  },
  {
    q: 'What should I do when a Medication Contradiction alert appears?',
    a: 'Click directly on the Contradictions tab in the patient profile. Baseline highlights conflicting medication pairs (such as newly introduced Amoxicillin for a patient with documented Penicillin allergy, or duplicate ACE-inhibitors). You can verify, document clinician override with clinical rationale, or update the prescription status directly.',
  },
  {
    q: 'Can family members see clinician-only notes and diagnoses?',
    a: 'No. Care Circle roles are strictly tiered. Family caregivers can view daily wellness updates, submit observations, and receive reassurance briefs, but sensitive clinical diagnostic codes, internal clinician tasks, and audit logs remain restricted to verified clinical users.',
  },
  {
    q: 'How do I generate an emergency PDF brief before a patient is transferred to the ER?',
    a: 'Navigate to the patient profile and click "Clinical Brief" or go to Reports -> Generate New Report -> Longitudinal Brief. Click "Download PDF" to instantly generate a 2-page acute transfer summary containing active medications, documented allergies, recent baseline drift, and caregiver observations.',
  },
  {
    q: 'How are voice observations from elderly patients processed?',
    a: 'Voice check-ins are securely transcribed using healthcare-tuned speech-to-text models. Clinical entity extraction maps symptoms, food intake, and sentiment into structured FHIR-compatible observations, while preserving the raw transcript for medical auditability.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketSubject('');
      setTicketMsg('');
    }, 4000);
  };

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.title.toLowerCase().includes(q) ||
      cat.desc.toLowerCase().includes(q) ||
      cat.articles.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-8 text-white shadow-lg">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <Badge className="bg-white/20 text-white hover:bg-white/30 border-none text-xs font-semibold px-2.5 py-1">
            Clinical Support & Knowledge Base
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">How can we support your care team today?</h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Access clinical documentation, guidance on AI trajectory baselines, care circle workflows, and emergency escalations.
          </p>

          <div className="relative pt-2">
            <Search className="absolute left-3.5 top-5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search topics, questions, troubleshooting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white text-foreground py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Quick Contact shortcuts */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/20 flex flex-wrap gap-4 text-xs font-medium">
          <a
            href="tel:+918002345678"
            className="inline-flex items-center gap-1.5 text-white/90 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Clinical Hotline: 1800-234-5678
          </a>
          <a
            href="mailto:support@careguardian.health"
            className="inline-flex items-center gap-1.5 text-white/90 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" /> support@careguardian.health
          </a>
          <span className="inline-flex items-center gap-1.5 text-blue-200">
            <Clock className="h-3.5 w-3.5" /> 24/7 Clinical Emergency On-Call
          </span>
        </div>
      </div>

      {/* Categories Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Explore Knowledge Base</h2>
          <span className="text-xs text-muted-foreground">{categories.length} core domains</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Card key={idx} className="border-border hover:shadow-md transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-semibold">{cat.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 text-xs">
                  <div className="space-y-1.5 border-t border-border pt-3">
                    {cat.articles.map((art, aIdx) => (
                      <div
                        key={aIdx}
                        onClick={() => alert(`Opening guide: "${art}"`)}
                        className="flex items-center justify-between text-muted-foreground hover:text-primary cursor-pointer py-1 group"
                      >
                        <span className="line-clamp-1">{art}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Answers to common clinical queries regarding AI health memory and patient care circles.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <Card
                key={index}
                className="border-border overflow-hidden transition-all duration-200 cursor-pointer"
                onClick={() => toggleFaq(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                    <button type="button" className="text-muted-foreground">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                  {isOpen && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact & Support Ticket Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Submit a Clinical Inquiry or Feature Request
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Direct line to the CareGuardian Clinical Informatics team. Typical response time is under 1 hour.
            </p>
          </CardHeader>
          <CardContent>
            {ticketSubmitted ? (
              <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold text-emerald-900">Inquiry submitted successfully!</p>
                <p className="text-xs text-emerald-700">Ticket #CG-{Math.floor(100000 + Math.random() * 900000)} has been routed to Clinical Informatics.</p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Subject / Issue Summary</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baseline anomaly false-positive threshold calibration"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Detailed Clinical Context</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe patient context, anomaly observation, or technical assistance required..."
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-muted-foreground">
                    Sender: Dr. Priya Sharma (dr.priya.sharma@careguardian.health)
                  </span>
                  <Button type="submit" size="sm" className="text-xs">
                    Dispatch Ticket
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Quick Links Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Platform Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <Link
              href="/clinician"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">Clinician Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/clinician/tasks"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">Clinical Tasks Hub</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/clinician/reports"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">Clinical Intelligence Reports</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/clinician/calendar"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">SVAR Appointments Calendar</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>

            <Link
              href="/clinician/settings"
              className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <span className="font-medium text-foreground">Clinician Profile & Settings</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
