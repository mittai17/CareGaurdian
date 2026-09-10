"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, MessageSquare, CheckSquare, ArrowRight, Clock, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/health/health-metric-card';
import { patientsApi } from '@/lib/api';
import type { YearStatus } from '@/lib/utils';

const stats = [
  { label: 'Patients', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Important Changes', value: '6', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Care Circle Reports', value: '18', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Tasks', value: '5', icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const priorityConfig = {
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
  high: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  medium: { label: 'Medium', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  low: { label: 'Low', className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

export default function ClinicianDashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientsApi.list()
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load patients:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const primaryPatientId = patients[0]?.id;

  const tasks = [
    { id: 1, text: 'Review changes — medication adherence ↓', priority: 'high', patientId: primaryPatientId },
    { id: 2, text: 'Review potential allergy conflict — Amoxicillin vs Penicillin allergy', priority: 'critical', patientId: primaryPatientId },
    { id: 3, text: 'Respond to Daughter — Care Circle message', priority: 'medium', patientId: primaryPatientId },
    { id: 4, text: 'Review HbA1c lab result', priority: 'medium', patientId: primaryPatientId },
    { id: 5, text: 'Lakshmi Raghavan — annual medication review due', priority: 'low', patientId: patients[1]?.id || '' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header with Verification Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">Attending Physician Dashboard</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              ✓ Verified Doctor (MCI-2012-88492)
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Dr. Vikram Malhotra, MD (Cardiology) • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
            <Link href="/nurse/handover">
              Caregiver Handovers
            </Link>
          </Button>
          <Button size="sm" asChild className="text-xs gap-1.5 bg-primary text-white">
            <Link href="/clinician/patients">
              View All Patients
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="card-hover">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent patients */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Patients</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/clinician/patients">
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Patient</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Review</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Changes</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patients.map((p) => {
                    const primaryDoctor = 'Dr. Elena Chen';
                    const currentYearStatus: YearStatus = 'WATCH';
                    const lastReview = p.updatedAt || new Date().toISOString();
                    const pendingChanges = 1;

                    return (
                      <tr key={p.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                              <p className="text-xs text-muted-foreground">{primaryDoctor}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={currentYearStatus} size="sm" />
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">
                          {lastReview ? new Date(lastReview).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {pendingChanges > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600 border border-orange-200">
                              <AlertTriangle className="h-3 w-3" />
                              {pendingChanges} changes
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/clinician/patients/${p.id}`}>
                              Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Today's Tasks</CardTitle>
              <Badge variant="secondary">{tasks.length}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {tasks.map((task) => {
                  const pc = priorityConfig[task.priority as keyof typeof priorityConfig];
                  return (
                    <Link
                      key={task.id}
                      href={`/clinician/patients/${task.patientId}`}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors"
                    >
                      <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-tight">{task.text}</p>
                        <span className={`mt-1.5 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${pc.className}`}>
                          {pc.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Care Circle Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Sarah Miller', rel: 'Daughter', text: 'Dad forgot his evening medicine yesterday and seemed confused about what day it was.', time: '2h ago', tag: 'Medication', patientId: primaryPatientId },
              { name: 'Maria Pelletier', rel: 'Caregiver', text: 'Morning medication still in pill box when I arrived at 9am.', time: '5h ago', tag: 'Medication', patientId: primaryPatientId },
              { name: 'Meena Iyer', rel: 'Neighbor', text: "He hasn't taken his morning walk all this week. Very unusual.", time: '1d ago', tag: 'Mobility', patientId: primaryPatientId },
            ].map((item, i) => (
              <Link key={i} href={`/clinician/patients/${item.patientId}/care-circle`} className="flex gap-4 rounded-lg p-3 hover:bg-accent/50 transition-colors">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
                  {item.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{item.rel}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 italic">&ldquo;{item.text}&rdquo;</p>
                  <Badge variant="secondary" className="mt-1.5 text-xs">{item.tag}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
