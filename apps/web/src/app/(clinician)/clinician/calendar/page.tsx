'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

const ClinicianCalendarView = dynamic(
  () => import('@/components/calendar/clinician-calendar-view'),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-72 bg-muted/60 animate-pulse rounded-md" />
          </div>
          <div className="h-9 w-40 bg-muted animate-pulse rounded-md" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="h-10 bg-muted/50 animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[500px] text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading Clinician Calendar...</p>
          </CardContent>
        </Card>
      </div>
    ),
  }
);

export default function ClinicianCalendarPage() {
  return <ClinicianCalendarView />;
}
