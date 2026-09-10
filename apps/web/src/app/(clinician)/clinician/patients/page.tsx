"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/health/health-metric-card';
import { Button } from '@/components/ui/button';
import { patientsApi } from '@/lib/api';
import { getAge } from '@/lib/utils';
import type { YearStatus } from '@/lib/utils';

export default function PatientsPage() {
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
    return <div className="p-6">Loading patients...</div>;
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">{patients.length} patients under your care</p>
        </div>
        <Button>Add Patient</Button>
      </div>

      <div className="grid gap-4">
        {patients.map((p) => {
          // Provide sensible fallbacks for UI aggregate fields that are not in the base patient model
          const primaryDoctor = 'Dr. Elena Chen'; // Could be extracted from relationships if API provided it
          const currentYearStatus: YearStatus = 'WATCH';
          const lastReview = p.updatedAt || new Date().toISOString();
          const careCircleCount = 5;
          const pendingChanges = 1;

          return (
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
                          <StatusBadge status={currentYearStatus} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {getAge(p.dateOfBirth)} years · {p.gender || 'Unknown'} · {primaryDoctor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Last Review</p>
                        <p className="text-sm font-medium">{lastReview ? new Date(lastReview).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Care Circle</p>
                        <p className="text-sm font-medium">{careCircleCount} people</p>
                      </div>
                      {pendingChanges > 0 && (
                        <div className="flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">{pendingChanges} changes</span>
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
          );
        })}
        {patients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No patients found. Make sure you have run the database seed script and are logged in!
          </div>
        )}
      </div>
    </div>
  );
}
