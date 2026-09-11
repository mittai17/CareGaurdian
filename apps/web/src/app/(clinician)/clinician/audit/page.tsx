'use client';

import { useState } from 'react';
import { ShieldCheck, Lock, Eye, Download, Search, AlertOctagon, CheckCircle2, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorHandle: string;
  action: string;
  targetPatient: string;
  ipAddress: string;
  outcome: 'SUCCESS' | 'WARNING' | 'OVERRIDE';
  details: string;
}

export default function ClinicianAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs] = useState<AuditLogEntry[]>([
    {
      id: 'aud-9801',
      timestamp: '2026-09-10T20:35:12Z',
      actor: 'Dr. Vikram Malhotra',
      actorHandle: '@dr_vikram_malhotra',
      action: 'PATIENT_RECORD_VIEW',
      targetPatient: 'Devaki Sundaram',
      ipAddress: '192.168.1.140',
      outcome: 'SUCCESS',
      details: 'Accessed longitudinal clinical brief, telemetry vitals, and medication list.',
    },
    {
      id: 'aud-9802',
      timestamp: '2026-09-10T19:12:44Z',
      actor: 'Karthik Sundaram',
      actorHandle: '@karthik_sundaram',
      action: 'CARE_CIRCLE_NOTE_SUBMIT',
      targetPatient: 'Devaki Sundaram',
      ipAddress: '103.21.124.9',
      outcome: 'SUCCESS',
      details: 'Logged daily morning weight observation (71.6 kg) and pedal edema report.',
    },
    {
      id: 'aud-9803',
      timestamp: '2026-09-10T18:05:01Z',
      actor: 'Dr. Vikram Malhotra',
      actorHandle: '@dr_vikram_malhotra',
      action: 'MEDICATION_DOSE_MODIFIED',
      targetPatient: 'Devaki Sundaram',
      ipAddress: '192.168.1.140',
      outcome: 'SUCCESS',
      details: 'Updated Furosemide titration schedule from 20mg daily to 40mg daily.',
    },
    {
      id: 'aud-9804',
      timestamp: '2026-09-09T22:40:19Z',
      actor: 'ER Physician On-Call',
      actorHandle: '@er_resident_apollo',
      action: 'BREAK_GLASS_OVERRIDE',
      targetPatient: 'Devaki Sundaram',
      ipAddress: '172.16.4.12',
      outcome: 'OVERRIDE',
      details: 'Emergency override authorized for acute dyspnea presentation; proxy notified.',
    },
    {
      id: 'aud-9805',
      timestamp: '2026-09-09T14:10:00Z',
      actor: 'System Security Daemon',
      actorHandle: '@daemon_neon_db',
      action: 'KEY_ROTATION',
      targetPatient: 'All Patients',
      ipAddress: '127.0.0.1',
      outcome: 'SUCCESS',
      details: 'Rotated AES-256 field-level column encryption master key.',
    }
  ]);

  const filtered = logs.filter(l =>
    l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.targetPatient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.actorHandle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            HIPAA Audit Trail & Security Provenance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tamper-evident, cryptographically hashed access logs tracking every clinical record touch, decryption, and Care Circle action.
          </p>
        </div>
        <Button variant="outline" className="gap-1.5">
          <Download className="w-4 h-4" />
          Export Compliance Log (.csv)
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by actor, action, patient, or handle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base">Event Records ({filtered.length})</CardTitle>
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
            Immutable Neon Write-Ahead Log
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/50 text-xs text-muted-foreground uppercase">
                <th className="text-left py-3 px-6 font-semibold">Timestamp</th>
                <th className="text-left py-3 px-4 font-semibold">Actor & Handle</th>
                <th className="text-left py-3 px-4 font-semibold">Action</th>
                <th className="text-left py-3 px-4 font-semibold">Subject Patient</th>
                <th className="text-left py-3 px-4 font-semibold">Details</th>
                <th className="text-right py-3 px-6 font-semibold">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6 text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-foreground">{log.actor}</div>
                    <div className="text-xs text-primary font-mono">{log.actorHandle}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                    {log.targetPatient}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {log.outcome === 'SUCCESS' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> SUCCESS
                      </span>
                    )}
                    {log.outcome === 'OVERRIDE' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <AlertOctagon className="w-3 h-3" /> OVERRIDE
                      </span>
                    )}
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
