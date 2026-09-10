'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  Users,
  MessageSquare,
  Plus,
  Shield,
  Phone,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CareCircleGroup {
  patientId: string;
  patientName: string;
  patientHandle: string;
  age: number;
  primaryCondition: string;
  members: {
    id: string;
    name: string;
    handle: string;
    role: 'GUARDIAN' | 'FAMILY_CAREGIVER' | 'PROFESSIONAL_CAREGIVER';
    relationship: string;
    email: string;
    phone: string;
    status: 'ACTIVE' | 'PENDING_INVITE';
    lastObservation?: string;
  }[];
}

const initialCareCircles: CareCircleGroup[] = [
  {
    patientId: '66c67bf7-f6e3-478e-b972-20d7d25b4958',
    patientName: 'Ravi Kumar',
    patientHandle: '@ravi_kumar50',
    age: 74,
    primaryCondition: 'T2DM, Mild Cognitive Decline, Hypertension',
    members: [
      {
        id: 'dc3a32da-21bf-4dc2-be6c-6f9ee354eddc',
        name: 'Ananya Kumar',
        handle: '@ananya_kumar',
        role: 'FAMILY_CAREGIVER',
        relationship: 'Daughter (Primary Carer)',
        email: 'ananya.kumar@careguardian.health',
        phone: '+91 98401 23456',
        status: 'ACTIVE',
        lastObservation: 'Logged gait change & throat antibiotic 2h ago',
      },
      {
        id: '6bacc18d-f92f-4ab1-a0d2-1b1b25c88ce7',
        name: 'Suresh Kumar',
        handle: '@suresh_kumar',
        role: 'FAMILY_CAREGIVER',
        relationship: 'Son',
        email: 'suresh.kumar@careguardian.health',
        phone: '+91 98401 77889',
        status: 'ACTIVE',
        lastObservation: 'Logged morning walk distance 2 days ago',
      },
      {
        id: 'bf182a38-1c84-4d54-8c64-bbb10319c0ca',
        name: 'Meena Iyer',
        handle: '@meena_iyer',
        role: 'FAMILY_CAREGIVER',
        relationship: 'Neighbour & Emergency Contact',
        email: 'meena.iyer@careguardian.health',
        phone: '+91 98401 99001',
        status: 'ACTIVE',
      },
    ],
  },
  {
    patientId: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
    patientName: 'Lakshmi Raghavan',
    patientHandle: '@lakshmi_r48',
    age: 68,
    primaryCondition: 'Hypothyroidism, Atrial Fibrillation, Hypertension',
    members: [
      {
        id: '12aca202-5859-47ba-94a9-bb201c00db8b',
        name: 'Suresh Raghavan',
        handle: '@suresh_raghavan',
        role: 'GUARDIAN',
        relationship: 'Husband & Legal Guardian',
        email: 'suresh.raghavan@careguardian.health',
        phone: '+91 98402 34567',
        status: 'ACTIVE',
        lastObservation: 'Logged BP 148/88 mmHg today at 9:12 AM',
      },
      {
        id: '80d25af6-5015-46ad-b2a8-2a6c10914c0d',
        name: 'Divya Raghavan',
        handle: '@divya_raghavan',
        role: 'FAMILY_CAREGIVER',
        relationship: 'Daughter-in-law',
        email: 'divya.raghavan@careguardian.health',
        phone: '+91 98403 45678',
        status: 'ACTIVE',
        lastObservation: 'Reported night wandering episode yesterday',
      },
    ],
  },
  {
    patientId: '77777777-0000-4000-8000-000000000001',
    patientName: 'Devaki Sundaram',
    patientHandle: '@devaki_sundaram',
    age: 79,
    primaryCondition: 'Congestive Heart Failure (HFpEF), Type 2 Diabetes',
    members: [
      {
        id: 'u-karthik',
        name: 'Karthik Sundaram',
        handle: '@karthik_sundaram',
        role: 'FAMILY_CAREGIVER',
        relationship: 'Son (Primary Carer)',
        email: 'karthik.sundaram@careguardian.health',
        phone: '+91 98409 99887',
        status: 'ACTIVE',
        lastObservation: 'Reported 2.1 kg weight spike and ankle edema',
      },
    ],
  },
  {
    patientId: '5b29040a-ea76-4cf3-9d2c-f63c70fcd419',
    patientName: 'Krishnamurthy Swaminathan',
    patientHandle: '@krishna_swami',
    age: 85,
    primaryCondition: 'Alzheimer’s Disease Moderate, T2DM',
    members: [
      {
        id: '1933e929-3045-4b72-b778-8e831e76a89d',
        name: 'Uma Swaminathan',
        handle: '@uma_swaminathan',
        role: 'GUARDIAN',
        relationship: 'Wife & Legal Guardian',
        email: 'uma.swaminathan@careguardian.health',
        phone: '+91 98404 11223',
        status: 'ACTIVE',
      },
      {
        id: 'e43e5eca-a3ac-4bf1-940d-b8d58f348629',
        name: 'Latha Reddy',
        handle: '@latha_caregiver',
        role: 'PROFESSIONAL_CAREGIVER',
        relationship: 'Professional Geriatric Nurse',
        email: 'latha.reddy@careguardian.health',
        phone: '+91 98404 56789',
        status: 'ACTIVE',
        lastObservation: 'Logged evening sundowning notes & speech fluency',
      },
    ],
  },
];

export default function ClinicianCareCirclePage() {
  const [careCircles, setCareCircles] = useState<CareCircleGroup[]>(initialCareCircles);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

  // Invite modal form state
  const [invitePatientName, setInvitePatientName] = useState('Lakshmi Raghavan');
  const [inviteName, setInviteName] = useState('');
  const [inviteHandle, setInviteHandle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'FAMILY_CAREGIVER' | 'GUARDIAN' | 'PROFESSIONAL_CAREGIVER'>('FAMILY_CAREGIVER');
  const [inviteRelation, setInviteRelation] = useState('');

  const copyToClipboard = (handle: string) => {
    navigator.clipboard?.writeText(handle);
    setCopiedHandle(handle);
    setTimeout(() => setCopiedHandle(null), 2000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const formattedHandle = inviteHandle.startsWith('@') ? inviteHandle : `@${inviteHandle.replace(/\s+/g, '_').toLowerCase()}`;

    setCareCircles((prev) =>
      prev.map((circle) => {
        if (circle.patientName === invitePatientName) {
          return {
            ...circle,
            members: [
              ...circle.members,
              {
                id: `mem-${Date.now()}`,
                name: inviteName.trim(),
                handle: formattedHandle || `@${inviteName.toLowerCase().replace(/\s+/g, '_')}`,
                role: inviteRole,
                relationship: inviteRelation || 'Caregiver',
                email: inviteEmail.trim(),
                phone: '+91 98400 00000',
                status: 'PENDING_INVITE',
              },
            ],
          };
        }
        return circle;
      })
    );

    setShowInviteModal(false);
    setInviteName('');
    setInviteHandle('');
    setInviteEmail('');
    setInviteRelation('');
  };

  const filteredCircles = careCircles.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.patientName.toLowerCase().includes(q) ||
      c.patientHandle.toLowerCase().includes(q) ||
      c.members.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.handle.toLowerCase().includes(q) ||
          m.relationship.toLowerCase().includes(q)
      )
    );
  });

  const totalMembers = careCircles.reduce((acc, c) => acc + c.members.length, 0);
  const activeCarers = careCircles.reduce(
    (acc, c) => acc + c.members.filter((m) => m.status === 'ACTIVE').length,
    0
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Care Circle Hub</h1>
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">
              Family & Carer Network
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Coordinate with patient families, guardians, and professional caregivers across your clinical roster.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowInviteModal(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Invite Caregiver
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Care Circles</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{careCircles.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Connected Caregivers</p>
                <p className="text-2xl font-bold text-blue-600 mt-0.5">{totalMembers}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Daily Loggers</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{activeCarers}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Legal Guardians</p>
                <p className="text-2xl font-bold text-purple-600 mt-0.5">3 Enrolled</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-border">
        <CardContent className="py-3 px-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by patient, caregiver name, or @handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-1.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Care Circle Patient Groups */}
      <div className="space-y-6">
        {filteredCircles.map((circle) => (
          <Card key={circle.patientId} className="border-border overflow-hidden shadow-sm">
            {/* Patient Circle Header */}
            <CardHeader className="py-4 px-6 bg-muted/20 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                  {circle.patientName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground">{circle.patientName}</h2>
                    <span className="text-xs font-semibold text-primary">{circle.patientHandle}</span>
                    <span className="text-xs text-muted-foreground">• Age {circle.age}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{circle.primaryCondition}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/clinician/patients/${circle.patientId}/care-circle`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                    View Care Feed <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
                <Link href="/clinician/messages">
                  <Button size="sm" className="text-xs gap-1.5 h-8">
                    <MessageSquare className="h-3 w-3" /> Message Circle
                  </Button>
                </Link>
              </div>
            </CardHeader>

            {/* Members Grid */}
            <CardContent className="p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Enrolled Family & Caregivers ({circle.members.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {circle.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">{member.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-semibold text-primary">{member.handle}</span>
                          <button
                            onClick={() => copyToClipboard(member.handle)}
                            className="text-muted-foreground hover:text-primary"
                            title="Copy handle"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {copiedHandle === member.handle && (
                            <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-semibold',
                          member.role === 'GUARDIAN' && 'bg-purple-50 text-purple-700 border-purple-200',
                          member.role === 'FAMILY_CAREGIVER' && 'bg-blue-50 text-blue-700 border-blue-200',
                          member.role === 'PROFESSIONAL_CAREGIVER' && 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        )}
                      >
                        {member.role === 'GUARDIAN' ? 'Guardian' : member.role === 'PROFESSIONAL_CAREGIVER' ? 'Nurse' : 'Family'}
                      </Badge>
                    </div>

                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p className="text-foreground font-medium">{member.relationship}</p>
                      <p className="truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {member.email}
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {member.phone}
                      </p>
                    </div>

                    {member.lastObservation && (
                      <div className="p-2 rounded-lg bg-muted/40 text-[11px] text-muted-foreground border border-border">
                        <span className="font-semibold text-foreground">Recent Log:</span> {member.lastObservation}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Active Caregiver
                      </span>

                      <Link href="/clinician/messages">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2 gap-1">
                          Direct Message <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal: Invite Caregiver */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-border max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" /> Invite Caregiver to Care Circle
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Patient</label>
                <select
                  value={invitePatientName}
                  onChange={(e) => setInvitePatientName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Lakshmi Raghavan">Lakshmi Raghavan</option>
                  <option value="Ravi Kumar">Ravi Kumar</option>
                  <option value="Devaki Sundaram">Devaki Sundaram</option>
                  <option value="Krishnamurthy Swaminathan">Krishnamurthy Swaminathan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Caregiver Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Raghavan"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Instagram-style Handle</label>
                <input
                  type="text"
                  placeholder="e.g. @ramesh_raghavan"
                  value={inviteHandle}
                  onChange={(e) => setInviteHandle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Caregiver Email</label>
                <input
                  type="email"
                  required
                  placeholder="caregiver@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="FAMILY_CAREGIVER">Family Caregiver</option>
                    <option value="GUARDIAN">Legal Guardian</option>
                    <option value="PROFESSIONAL_CAREGIVER">Nurse / Pro Carer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Relationship</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Son, Daughter, Nurse"
                    value={inviteRelation}
                    onChange={(e) => setInviteRelation(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)} size="sm">
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Send Care Circle Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
