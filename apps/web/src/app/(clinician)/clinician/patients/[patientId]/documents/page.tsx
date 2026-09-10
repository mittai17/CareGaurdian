'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, UploadCloud, Download, Eye, Shield, FileCheck, Calendar, Filter } from 'lucide-react';

interface PatientDoc {
  id: string;
  title: string;
  category: string;
  source: string;
  date: string;
  fileSize: string;
  fileType: string;
  status: 'Verified' | 'Pending Review';
}

export default function PatientDocumentsPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [docs, setDocs] = useState<PatientDoc[]>([
    {
      id: 'doc-1',
      title: 'Echocardiogram Transthoracic Report (LVEF 52%)',
      category: 'Cardiology Diagnostics',
      source: 'Apollo Heart Center',
      date: '2026-08-22',
      fileSize: '2.4 MB',
      fileType: 'PDF',
      status: 'Verified',
    },
    {
      id: 'doc-2',
      title: 'Discharge Summary - Cardiac Care Unit',
      category: 'Inpatient Summary',
      source: 'Manipal Hospital ICU',
      date: '2026-07-14',
      fileSize: '4.1 MB',
      fileType: 'PDF',
      status: 'Verified',
    },
    {
      id: 'doc-3',
      title: 'Comprehensive Metabolic Panel & HbA1c Lab Slips',
      category: 'Laboratory',
      source: 'Dr. Lal PathLabs',
      date: '2026-09-02',
      fileSize: '820 KB',
      fileType: 'PDF',
      status: 'Verified',
    },
    {
      id: 'doc-4',
      title: 'Bilateral Renal Artery Doppler Ultrasound',
      category: 'Imaging',
      source: 'CareGuardian Diagnostic Center',
      date: '2026-06-19',
      fileSize: '5.6 MB',
      fileType: 'PDF',
      status: 'Verified',
    }
  ]);

  useEffect(() => {
    async function load() {
      try {
        const res = await patientsApi.getById(patientId);
        setPatient(res?.data || res || null);
      } catch (e) {
        console.error('Failed to load patient:', e);
        setPatient(MOCK_PATIENTS_MAP[patientId] ?? null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) return <div className="p-8 text-center text-muted-foreground">Patient not found.</div>;

  return (
    <div>
      <PatientHeader patient={patient} />
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Medical Documents & Clinical Records
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Longitudinal repository of uploaded clinical summaries, lab slips, imaging scans, and referral notes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <UploadCloud className="w-4 h-4" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Upload Dropzone Preview */}
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-slate-50/60 transition-colors cursor-pointer bg-white">
          <UploadCloud className="w-10 h-10 text-primary/70 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-foreground">Click to upload or drag and drop medical documents</h4>
          <p className="text-xs text-muted-foreground mt-1">PDF, DICOM, JPG, PNG up to 50MB. Automatically vectorized into Baseline memory.</p>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base">Document Vault ({docs.length})</CardTitle>
            <Badge variant="secondary">HIPAA Encrypted</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {docs.map((doc) => (
                <div key={doc.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-200">
                      {doc.fileType}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{doc.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-slate-700">{doc.category}</span>
                        <span>•</span>
                        <span>{doc.source}</span>
                        <span>•</span>
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {doc.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <FileCheck className="w-3 h-3" />
                      {doc.status}
                    </span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="w-4 h-4 text-slate-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
