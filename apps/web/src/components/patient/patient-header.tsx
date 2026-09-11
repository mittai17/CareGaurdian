'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity, Brain, Pill, Users, FileText, Heart, BarChart2,
  AlertTriangle, Info, ChevronLeft, Clock, Network, FlaskConical,
  Folder, AlertOctagon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAge, statusConfig, type YearStatus } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PatientHeaderProps {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    primaryDoctor?: string;
    lastClinicalReview?: string;
    careCircleCount?: number;
    status?: string;
    currentYearStatus?: string;
    dementiaStage?: string;
    aadhaarNo?: string; // Aadhaar-based unique patient identifier
  };
}

const patientNavItems = [
  { href: '', label: 'Overview', icon: Activity, exact: true },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/graph', label: 'Health Graph', icon: BarChart2 },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/observations', label: 'Observations', icon: Brain },
  { href: '/baseline', label: 'Baseline', icon: Activity },
  { href: '/care-circle', label: 'Care Circle', icon: Heart },
  { href: '/episodes', label: 'Episodes', icon: FileText },
  { href: '/evidence', label: 'Evidence', icon: Info },
  { href: '/contradictions', label: 'Conflicts', icon: AlertTriangle },
  { href: '/missing-information', label: 'Gaps', icon: Info },
  { href: '/clinical-brief', label: 'Clinical Brief', icon: FileText },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/care-circle', label: 'Care Circle', icon: Users },
];

// Deduplicate and use a cleaner list
const navItems = [
  { href: '', label: 'Overview', icon: Activity },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/graph', label: 'Health Graph', icon: Network },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/observations', label: 'Observations', icon: Brain },
  { href: '/labs', label: 'Labs', icon: FlaskConical },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/documents', label: 'Documents', icon: Folder },
  { href: '/baseline', label: 'Baseline', icon: BarChart2 },
  { href: '/care-circle', label: 'Care Circle', icon: Heart },
  { href: '/episodes', label: 'Episodes', icon: FileText },
  { href: '/evidence', label: 'Evidence', icon: Info },
  { href: '/contradictions', label: 'Conflicts', icon: AlertTriangle },
  { href: '/missing-information', label: 'Gaps', icon: Info },
  { href: '/clinical-brief', label: 'Clinical Brief', icon: FileText },
  { href: '/emergency', label: 'Emergency', icon: AlertOctagon },
];

export function PatientHeader({ patient }: PatientHeaderProps) {
  const pathname = usePathname();
  const age = getAge(patient.dateOfBirth);
  const yearStatus = patient.currentYearStatus as YearStatus;
  const statusCfg = yearStatus ? statusConfig[yearStatus] : null;
  const basePath = `/clinician/patients/${patient.id}`;

  const isTabActive = (tabHref: string) => {
    const fullHref = basePath + tabHref;
    if (tabHref === '') return pathname === basePath;
    return pathname.startsWith(fullHref);
  };

  return (
    <div className="border-b border-border bg-white sticky top-0 z-30">
      {/* Back + patient info */}
      <div className="px-6 pt-4 pb-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <Link
              href="/clinician/patients"
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Patients
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-base">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">
                      {patient.firstName} {patient.lastName}
                    </h1>
                    {statusCfg && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border',
                          statusCfg.bg, statusCfg.text, statusCfg.border
                        )}
                      >
                        {statusCfg.emoji} {statusCfg.label}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {patient.status ?? 'Active'}
                    </Badge>
                    {patient.dementiaStage && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">
                        {patient.dementiaStage}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {age} years · {patient.gender ?? 'Unknown'} ·{' '}
                    {patient.aadhaarNo ? (
                      <span className="text-xs font-mono text-muted-foreground">
                        Aadhaar: XXXX XXXX {patient.aadhaarNo.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">ID: {patient.id.slice(0, 12)}…</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Primary Doctor</p>
              <p className="text-sm font-medium">{patient.primaryDoctor ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Review</p>
              <p className="text-sm font-medium">
                {patient.lastClinicalReview
                  ? new Date(patient.lastClinicalReview).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Care Circle</p>
              <p className="text-sm font-medium">{patient.careCircleCount ?? 0} people</p>
            </div>
          </div>
        </div>

        {/* Patient nav tabs */}
        <div className="flex gap-0 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isTabActive(href);
            return (
              <Link
                key={href}
                href={`${basePath}${href}`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
