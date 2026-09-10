import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/health/health-metric-card';
import { Button } from '@/components/ui/button';
import { demoPatients } from '@/lib/demo-data';
import { getAge } from '@/lib/utils';
import type { YearStatus } from '@/lib/utils';

export const metadata: Metadata = { title: 'Patients' };

export default function PatientsPage() {
  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">{demoPatients.length} patients under your care</p>
        </div>
        <Button>Add Patient</Button>
      </div>

      {/* Demo notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
        🔬 Demo data — synthetic patients only. No real patient information.
      </div>

      <div className="grid gap-4">
        {demoPatients.map((p) => (
          <Link key={p.id} href={`/clinician/patients/${p.id}`}>
            <Card className="card-hover cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-foreground">{p.firstName} {p.lastName}</h2>
                        <StatusBadge status={p.currentYearStatus as YearStatus} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {getAge(p.dateOfBirth)} years · {p.gender} · {p.primaryDoctor}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Last Review</p>
                      <p className="text-sm font-medium">{p.lastReview ? new Date(p.lastReview).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Care Circle</p>
                      <p className="text-sm font-medium">{p.careCircleCount} people</p>
                    </div>
                    {p.pendingChanges > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">{p.pendingChanges} changes</span>
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
