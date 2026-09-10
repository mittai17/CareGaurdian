'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, CheckCircle2, Clock, Filter, ArrowRight, ShieldAlert, Heart, User, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  patientName: string;
  patientId: string;
  sender: string;
  time: string;
  type: 'urgent' | 'warning' | 'info' | 'caregiver';
  read: boolean;
}

export default function ClinicianNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Telemetry Anomaly: Rapid Weight Surge (+3.4 kg in 48h)',
      message: 'Devaki Sundaram recorded sudden 3.4kg weight increase. Symptom exacerbation confirmed by caregiver Karthik Sundaram.',
      patientName: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      sender: 'AI Telemetry Engine',
      time: '25m ago',
      type: 'urgent',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'New Care Circle Observation Logged',
      message: 'Caregiver reported: "Patient experienced mild bilateral ankle swelling after dinner. Administered prescribed Furosemide."',
      patientName: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      sender: '@karthik_sundaram',
      time: '2h ago',
      type: 'caregiver',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Drug-Drug Conflict Warning: NSAID vs HFpEF Diuretic',
      message: 'Over-the-counter Ibuprofen detected in family diary contradicts ongoing Furosemide regimen.',
      patientName: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      sender: 'Safety Agent',
      time: '5h ago',
      type: 'warning',
      read: true,
    },
    {
      id: 'notif-4',
      title: 'Quarterly Lab Work Due: HbA1c & Lipid Panel',
      message: '90-day diabetic biomarker interval reached. Order pending physician sign-off.',
      patientName: 'Devaki Sundaram',
      patientId: '77777777-0000-4000-8000-000000000001',
      sender: 'Clinical Reminder',
      time: '1d ago',
      type: 'info',
      read: true,
    }
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markOne = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'urgent') return n.type === 'urgent';
    return true;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Clinical Notifications & Real-Time Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time telemetry spikes, Care Circle observations, medication safety alerts, and lab reminders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1.5">
            <Check className="w-4 h-4" />
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({notifications.filter(n => !n.read).length})
        </Button>
        <Button
          variant={filter === 'urgent' ? 'destructive' : 'ghost'}
          size="sm"
          onClick={() => setFilter('urgent')}
        >
          Urgent ({notifications.filter(n => n.type === 'urgent').length})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          return (
            <Card
              key={item.id}
              className={`transition-colors border ${
                !item.read ? 'border-l-4 border-l-primary bg-primary/[0.02]' : 'hover:bg-slate-50/50'
              }`}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className="mt-1">
                  {item.type === 'urgent' && (
                    <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  )}
                  {item.type === 'caregiver' && (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </div>
                  )}
                  {item.type === 'warning' && (
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  {item.type === 'info' && (
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-border/80">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{item.patientName}</span>
                      <span>•</span>
                      <span>Source: {item.sender}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!item.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markOne(item.id)}
                          className="text-xs h-7 px-2"
                        >
                          Mark read
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild className="text-xs h-7 px-2.5 gap-1">
                        <Link href={`/clinician/patients/${item.patientId}`}>
                          View Patient <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
