'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Heart,
  Activity,
  AlertTriangle,
  MessageSquare,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CaregiverMember {
  id: string;
  name: string;
  handle: string;
  role: 'VERIFIED_NURSE' | 'VERIFIED_CAREGIVER' | 'FAMILY_CAREGIVER';
  assignedPatient: string;
  patientId: string;
  shiftSchedule: string;
  burnoutRisk: 'LOW' | 'MODERATE' | 'HIGH';
  weeklyHours: number;
  lastActive: string;
  phone: string;
}

export default function ClinicianCaregiversPage() {
  const [caregivers, setCaregivers] = useState<CaregiverMember[]>([
    {
      id: 'cg-1',
      name: 'Sister Mary Joseph',
      handle: '@nurse_mary',
      role: 'VERIFIED_NURSE',
      assignedPatient: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      shiftSchedule: 'Day Shift (07:00 AM – 03:00 PM)',
      burnoutRisk: 'LOW',
      weeklyHours: 36,
      lastActive: '10m ago',
      phone: '+91 98400 11223',
    },
    {
      id: 'cg-2',
      name: 'Karthik Sundaram',
      handle: '@karthik_sundaram',
      role: 'FAMILY_CAREGIVER',
      assignedPatient: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      shiftSchedule: 'Continuous Family Care',
      burnoutRisk: 'MODERATE',
      weeklyHours: 48,
      lastActive: '2h ago',
      phone: '+91 98401 23456',
    },
    {
      id: 'cg-3',
      name: 'Nurse Priya Ramesh',
      handle: '@nurse_priya',
      role: 'VERIFIED_NURSE',
      assignedPatient: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      shiftSchedule: 'Evening Shift (03:00 PM – 11:00 PM)',
      burnoutRisk: 'LOW',
      weeklyHours: 32,
      lastActive: '1h ago',
      phone: '+91 98402 34567',
    },
    {
      id: 'cg-4',
      name: 'Ananya Kumar',
      handle: '@ananya_kumar',
      role: 'FAMILY_CAREGIVER',
      assignedPatient: 'Ramesh Patel',
      patientId: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
      shiftSchedule: 'Daughter / Weekend Support',
      burnoutRisk: 'LOW',
      weeklyHours: 18,
      lastActive: '3h ago',
      phone: '+91 98403 45678',
    }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Caregiver Assignments & Burnout Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Coordinate nursing teams and family members, monitor caregiver workload fatigue, and review shift transitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/nurse/handover">
              <FileSpreadsheet className="w-4 h-4" />
              View Shift Handovers
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Assign New Caregiver
          </Button>
        </div>
      </div>

      {/* Burnout Risk Summary Alert */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold text-blue-950">AI Burnout Monitor: 1 Caregiver at Moderate Workload</span>
            <p className="text-blue-800 text-xs mt-0.5">
              Karthik Sundaram has logged 48 cumulative care hours this week managing his mother&apos;s acute fluid retention. Day/Evening nurse shifts are actively relieving family burden.
            </p>
          </div>
        </div>
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 whitespace-nowrap">
          Moderate Attention
        </Badge>
      </div>

      {/* Caregiver Roster Table */}
      <Card>
        <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base">Active Clinical & Family Care Team ({caregivers.length})</CardTitle>
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50">All Credentials Verified</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/50 text-xs text-muted-foreground uppercase">
                <th className="text-left py-3 px-6 font-semibold">Caregiver</th>
                <th className="text-left py-3 px-4 font-semibold">Role & Credential</th>
                <th className="text-left py-3 px-4 font-semibold">Assigned Patient</th>
                <th className="text-left py-3 px-4 font-semibold">Shift Schedule</th>
                <th className="text-left py-3 px-4 font-semibold">Burnout Risk</th>
                <th className="text-right py-3 px-6 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {caregivers.map((cg) => (
                <tr key={cg.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-foreground">{cg.name}</div>
                    <div className="text-xs text-primary font-mono">{cg.handle}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {cg.role === 'VERIFIED_NURSE' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Verified Nurse
                      </span>
                    )}
                    {cg.role === 'FAMILY_CAREGIVER' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                        🟣 Family Member
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Link href={`/clinician/patients/${cg.patientId}`} className="font-medium text-slate-900 hover:text-primary transition-colors">
                      {cg.assignedPatient}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    {cg.shiftSchedule}
                  </td>
                  <td className="py-3.5 px-4">
                    {cg.burnoutRisk === 'LOW' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Low ({cg.weeklyHours}h/wk)
                      </span>
                    )}
                    {cg.burnoutRisk === 'MODERATE' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3 h-3" /> Moderate ({cg.weeklyHours}h/wk)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Button size="sm" variant="ghost" asChild className="h-8 px-2.5 text-xs text-primary gap-1">
                      <Link href="/clinician/messages">
                        <MessageSquare className="w-3.5 h-3.5" /> Direct Chat
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
