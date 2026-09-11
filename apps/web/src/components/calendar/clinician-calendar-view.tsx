'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Editor, Willow } from '@svar-ui/react-calendar';
import '@svar-ui/react-calendar/all.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';
import { patientsApi } from '@/lib/api';

export interface ClinicAppointment {
  id: string | number;
  text: string;
  start: Date;
  end: Date;
  patientId?: string;
  patientName?: string;
  type: 'consultation' | 'medication_review' | 'care_circle' | 'urgent_followup' | 'lab_review';
  details?: string;
  color?: string;
  location?: string;
}

export default function ClinicianCalendarView() {
  const [api, setApi] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Reference base date matching current context (September 2026)
  const [currentDate] = useState<Date>(() => new Date(2026, 8, 11, 9, 0));

  // Default seed appointments for Dr. Priya Sharma
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([
    {
      id: 1,
      text: 'Routine Consultation — Lakshmi Raghavan',
      patientName: 'Lakshmi Raghavan',
      start: new Date(2026, 8, 11, 9, 30),
      end: new Date(2026, 8, 11, 10, 15),
      type: 'consultation',
      details: 'Quarterly hypertension and mobility check. Review blood pressure readings.',
      location: 'Consultation Room 3A',
    },
    {
      id: 2,
      text: 'Care Circle Family Sync — Mohan Pillai',
      patientName: 'Mohan Pillai',
      start: new Date(2026, 8, 11, 11, 0),
      end: new Date(2026, 8, 11, 11, 45),
      type: 'care_circle',
      details: 'Video sync with primary family caregiver regarding recent night-time confusion episodes.',
      location: 'Telehealth Room 2',
    },
    {
      id: 3,
      text: 'Urgent Alert Follow-up — Ravi Kumar',
      patientName: 'Ravi Kumar',
      start: new Date(2026, 8, 11, 13, 30),
      end: new Date(2026, 8, 11, 14, 15),
      type: 'urgent_followup',
      details: 'Caregiver reported near-fall and noticeable walking speed reduction over past 48 hours.',
      location: 'Consultation Room 3A',
    },
    {
      id: 4,
      text: 'Medication Adherence Review — Kamala Venkatesh',
      patientName: 'Kamala Venkatesh',
      start: new Date(2026, 8, 11, 15, 0),
      end: new Date(2026, 8, 11, 15, 30),
      type: 'medication_review',
      details: 'Evaluate NSAID tolerance and pain management schedule.',
      location: 'Consultation Room 3A',
    },
    {
      id: 5,
      text: 'Lab Results Evaluation — Sunita Balasubramanian',
      patientName: 'Sunita Balasubramanian',
      start: new Date(2026, 8, 12, 10, 0),
      end: new Date(2026, 8, 12, 10, 30),
      type: 'lab_review',
      details: 'Review DEXA bone density and recent calcium serum panels.',
      location: 'Clinical Office',
    },
    {
      id: 6,
      text: 'Cognitive Decline Baseline Check — Krishnamurthy Swaminathan',
      patientName: 'Krishnamurthy Swaminathan',
      start: new Date(2026, 8, 12, 11, 30),
      end: new Date(2026, 8, 12, 12, 30),
      type: 'consultation',
      details: 'MMSE Assessment & baseline health memory timeline cross-check.',
      location: 'Room 1B (Specialty Clinic)',
    },
    {
      id: 7,
      text: 'Care Circle Weekly Briefing — Ravi Kumar',
      patientName: 'Ravi Kumar',
      start: new Date(2026, 8, 13, 9, 0),
      end: new Date(2026, 8, 13, 9, 45),
      type: 'care_circle',
      details: 'Sync with daughter Ananya regarding food intake & hydration logs.',
      location: 'Telehealth Room 1',
    },
    {
      id: 8,
      text: 'Medication Reconciliation — Lakshmi Raghavan',
      patientName: 'Lakshmi Raghavan',
      start: new Date(2026, 8, 14, 14, 0),
      end: new Date(2026, 8, 14, 14, 45),
      type: 'medication_review',
      details: 'Cross-reference prescription vs reported over-the-counter herbal supplements.',
      location: 'Consultation Room 3A',
    },
    {
      id: 9,
      text: 'Parkinson Tremor Evaluation — Padmanabhan Nambiar',
      patientName: 'Padmanabhan Nambiar',
      start: new Date(2026, 8, 15, 10, 30),
      end: new Date(2026, 8, 15, 11, 15),
      type: 'consultation',
      details: 'Motor assessment & daily caregiver diary analysis.',
      location: 'Consultation Room 3A',
    },
  ]);

  // Form state for creating an appointment
  const [newTitle, setNewTitle] = useState('');
  const [newPatient, setNewPatient] = useState('Lakshmi Raghavan');
  const [newType, setNewType] = useState<'consultation' | 'medication_review' | 'care_circle' | 'urgent_followup' | 'lab_review'>('consultation');
  const [newDateStr, setNewDateStr] = useState('2026-09-11');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newDuration, setNewDuration] = useState('45');
  const [newDetails, setNewDetails] = useState('');

  // Fetch actual registered patients from API
  useEffect(() => {
    patientsApi
      .list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
          const first = data[0];
          setNewPatient(first.fullName || first.name || 'Lakshmi Raghavan');
        }
      })
      .catch((err) => {
        console.warn('Using seeded patients for calendar (API offline or unauthenticated):', err);
      })
      .finally(() => {
        setLoadingPatients(false);
      });
  }, []);

  // Filtered appointments passed to the SVAR Calendar
  const filteredEvents = useMemo(() => {
    return appointments
      .filter((app) => {
        if (selectedPatientFilter !== 'ALL' && app.patientName !== selectedPatientFilter) {
          return false;
        }
        if (selectedTypeFilter !== 'ALL' && app.type !== selectedTypeFilter) {
          return false;
        }
        return true;
      })
      .map((app) => ({
        id: app.id,
        text: app.text,
        start: app.start,
        end: app.end,
        details: app.details,
      }));
  }, [appointments, selectedPatientFilter, selectedTypeFilter]);

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const [year, month, day] = newDateStr.split('-').map(Number);
    const [hours, minutes] = newStartTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes);
    const end = new Date(start.getTime() + Number(newDuration) * 60 * 1000);

    const newApp: ClinicAppointment = {
      id: Date.now(),
      text: `${newTitle} — ${newPatient}`,
      patientName: newPatient,
      start,
      end,
      type: newType,
      details: newDetails,
      location: newType === 'care_circle' ? 'Telehealth Room' : 'Consultation Room 3A',
    };

    setAppointments((prev) => [...prev, newApp]);
    setShowAddModal(false);
    setNewTitle('');
    setNewDetails('');
  };

  const todayCount = appointments.filter(
    (a) =>
      a.start.getFullYear() === 2026 &&
      a.start.getMonth() === 8 &&
      a.start.getDate() === 11
  ).length;

  const urgentCount = appointments.filter((a) => a.type === 'urgent_followup').length;
  const careCircleCount = appointments.filter((a) => a.type === 'care_circle').length;
  const reviewCount = appointments.filter((a) => a.type === 'medication_review').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clinician Schedule</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              SVAR Calendar
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage patient consultations, care circle conferences, and medication reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Schedule Appointment
          </Button>
        </div>
      </div>

      {/* Metric summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Today's Schedule</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{todayCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Urgent Follow-ups</p>
                <p className="text-2xl font-bold text-rose-600 mt-0.5">{urgentCount}</p>
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
                <p className="text-xs font-medium text-muted-foreground">Care Circle Syncs</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{careCircleCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Video className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Med Adherence Reviews</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{reviewCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and View Bar */}
      <Card className="border-border">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                <Filter className="h-3.5 w-3.5" /> Filters:
              </span>

              {/* Patient Filter */}
              <select
                value={selectedPatientFilter}
                onChange={(e) => setSelectedPatientFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Patients</option>
                <option value="Lakshmi Raghavan">Lakshmi Raghavan</option>
                <option value="Mohan Pillai">Mohan Pillai</option>
                <option value="Kamala Venkatesh">Kamala Venkatesh</option>
                <option value="Ravi Kumar">Ravi Kumar</option>
                <option value="Sunita Balasubramanian">Sunita Balasubramanian</option>
                <option value="Krishnamurthy Swaminathan">Krishnamurthy Swaminathan</option>
                <option value="Padmanabhan Nambiar">Padmanabhan Nambiar</option>
              </select>

              {/* Appointment Type Filter */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Appointment Types</option>
                <option value="consultation">In-Person Consultation</option>
                <option value="medication_review">Medication Review</option>
                <option value="care_circle">Care Circle Sync</option>
                <option value="urgent_followup">Urgent Follow-up</option>
                <option value="lab_review">Lab Results Review</option>
              </select>

              {(selectedPatientFilter !== 'ALL' || selectedTypeFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPatientFilter('ALL');
                    setSelectedTypeFilter('ALL');
                  }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Reset
                </Button>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Consultation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Care Circle
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Urgent Alert
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Med Review
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Calendar Container with SVAR UI */}
      <Card className="border-border overflow-hidden shadow-sm">
        <CardHeader className="py-3 px-5 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Interactive Appointments Grid
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            Powered by <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">@svar-ui/react-calendar</code>
          </span>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full min-h-[650px] bg-white rounded-lg">
            <Willow>
              <Calendar
                init={setApi}
                events={filteredEvents}
                date={currentDate}
                view="week"
                views={['day', 'week', 'month']}
              />
              {api && <Editor api={api} />}
            </Willow>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" /> Schedule New Appointment
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Title / Reason
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cognitive Review, Blood Pressure Follow-up"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Patient
                  </label>
                  <select
                    value={newPatient}
                    onChange={(e) => setNewPatient(e.target.value)}
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
                    Appointment Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="consultation">In-Person Consultation</option>
                    <option value="care_circle">Care Circle Sync</option>
                    <option value="medication_review">Medication Review</option>
                    <option value="urgent_followup">Urgent Follow-up</option>
                    <option value="lab_review">Lab Review</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDateStr}
                    onChange={(e) => setNewDateStr(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Duration
                  </label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Clinical Notes / Context
                </label>
                <textarea
                  rows={2}
                  placeholder="Reason for visit, required tests or caregiver discussion items..."
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Confirm & Add to Calendar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
