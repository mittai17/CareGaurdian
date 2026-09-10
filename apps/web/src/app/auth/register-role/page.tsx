'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Heart,
  Users,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  Building2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function RoleRegistrationPage() {
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'nurse' | 'family' | 'patient'>('doctor');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Doctor Fields
  const [docName, setDocName] = useState('Dr. Vikram Malhotra');
  const [docRegNo, setDocRegNo] = useState('MCI-2012-88492');
  const [docCouncil, setDocCouncil] = useState('Tamil Nadu Medical Council');
  const [docQual, setDocQual] = useState('MBBS, MD (Cardiology), FACC');
  const [docEmail, setDocEmail] = useState('dr.vikram.malhotra@careguardian.health');
  const [docPhone, setDocPhone] = useState('+91 98400 11223');
  const [docGovtId, setDocGovtId] = useState('Aadhaar / Passport verified');

  // Nurse/Professional Caregiver Fields
  const [nurseName, setNurseName] = useState('Sister Mary Joseph');
  const [nurseRegNo, setNurseRegNo] = useState('INC-RN-441209');
  const [nurseCouncil, setNurseCouncil] = useState('State Nursing Council');
  const [nurseQual, setNurseQual] = useState('B.Sc. Nursing, Critical Care Certified');
  const [hasNursingReg, setHasNursingReg] = useState(true);

  // Family Caregiver Fields
  const [familyName, setFamilyName] = useState('Arun Kumar');
  const [familyRel, setFamilyRel] = useState('Son of Patient');
  const [familyPatient, setFamilyPatient] = useState('Devaki Sundaram');

  // Patient Fields
  const [patientName, setPatientName] = useState('Devaki Sundaram');
  const [patientAge, setPatientAge] = useState('72');
  const [patientLang, setPatientLang] = useState('Tamil & English');

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Verified Healthcare Identity Network
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            CareGuardian Multi-Role Registration & Verification
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Choose your role to start the credential verification workflow. Only verified clinical professionals receive certified badges.
          </p>
        </div>

        {/* Role Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => { setSelectedRole('doctor'); setStep(1); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRole === 'doctor'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                : 'border-border bg-white hover:bg-slate-50'
            }`}
          >
            <Stethoscope className={`w-6 h-6 mb-2 ${selectedRole === 'doctor' ? 'text-primary' : 'text-slate-500'}`} />
            <h3 className="font-semibold text-sm">Doctor</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Medical Council Reg</p>
          </button>

          <button
            onClick={() => { setSelectedRole('nurse'); setStep(1); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRole === 'nurse'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm'
                : 'border-border bg-white hover:bg-slate-50'
            }`}
          >
            <Building2 className={`w-6 h-6 mb-2 ${selectedRole === 'nurse' ? 'text-blue-600' : 'text-slate-500'}`} />
            <h3 className="font-semibold text-sm">Nurse / Caregiver</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Professional Staff</p>
          </button>

          <button
            onClick={() => { setSelectedRole('family'); setStep(1); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRole === 'family'
                ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-sm'
                : 'border-border bg-white hover:bg-slate-50'
            }`}
          >
            <Users className={`w-6 h-6 mb-2 ${selectedRole === 'family' ? 'text-purple-600' : 'text-slate-500'}`} />
            <h3 className="font-semibold text-sm">Family Member</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Caregiver Proxy</p>
          </button>

          <button
            onClick={() => { setSelectedRole('patient'); setStep(1); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRole === 'patient'
                ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-border bg-white hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-6 h-6 mb-2 ${selectedRole === 'patient' ? 'text-emerald-600' : 'text-slate-500'}`} />
            <h3 className="font-semibold text-sm">Patient</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Elderly Care Recipient</p>
          </button>
        </div>

        {/* Verification Flow Card */}
        {selectedRole === 'doctor' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    Doctor Credential Verification Flow
                  </CardTitle>
                  <CardDescription>
                    Requires medical council registration certificate and government identification.
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Verified Doctor Badge
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Verification Steps Indicator */}
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b pb-4">
                <span className="text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 1. Registration
                </span>
                <span>&rarr;</span>
                <span className="text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 2. Identity Verification
                </span>
                <span>&rarr;</span>
                <span className="text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 3. Certificate Check
                </span>
                <span>&rarr;</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Verified Doctor
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Medical Registration Number</label>
                  <input
                    type="text"
                    value={docRegNo}
                    onChange={(e) => setDocRegNo(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">State Medical Council</label>
                  <input
                    type="text"
                    value={docCouncil}
                    onChange={(e) => setDocCouncil(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Postgraduate Qualification</label>
                  <input
                    type="text"
                    value={docQual}
                    onChange={(e) => setDocQual(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Document upload mock */}
              <div className="border border-dashed rounded-xl p-4 bg-slate-50 text-center">
                <UploadCloud className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xs font-medium">Medical Registration Certificate (PDF/JPG)</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ TN_Medical_Council_Cert_2012.pdf verified via Digilocker/NMC API</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link href="/auth/login" className="text-xs text-muted-foreground hover:underline">
                  Already have an account? Sign in
                </Link>
                <Button asChild className="gap-2">
                  <Link href="/clinician">
                    Enter Doctor Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nurse / Professional Caregiver Flow */}
        {selectedRole === 'nurse' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Professional Nurse & Caregiver Credential Verification
                  </CardTitle>
                  <CardDescription>
                    Requires background check, first-aid certification, and nursing council credentials.
                  </CardDescription>
                </div>
                <Badge className={hasNursingReg ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-800'}>
                  {hasNursingReg ? 'Verified Nurse' : 'Verified Caregiver'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    value={nurseName}
                    onChange={(e) => setNurseName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Nursing Registration Number</label>
                  <input
                    type="text"
                    value={nurseRegNo}
                    onChange={(e) => setNurseRegNo(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Nursing Council / State</label>
                  <input
                    type="text"
                    value={nurseCouncil}
                    onChange={(e) => setNurseCouncil(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Clinical Qualification & Experience</label>
                  <input
                    type="text"
                    value={nurseQual}
                    onChange={(e) => setNurseQual(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-blue-900">Credential Verification Rule:</span>
                <p className="text-blue-800">
                  Only staff with verified state nursing council licenses display the <strong>Verified Nurse</strong> badge. Trained caregivers without active nursing licenses display the <strong>Verified Caregiver</strong> badge.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link href="/auth/login" className="text-xs text-muted-foreground hover:underline">
                  Sign in with existing credentials
                </Link>
                <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Link href="/nurse">
                    Enter Nurse Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Family Caregiver Flow */}
        {selectedRole === 'family' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                    <Users className="w-5 h-5 text-purple-600" />
                    Family Member Caregiver Registration
                  </CardTitle>
                  <CardDescription>
                    No medical or nursing qualifications required. Simple identity check and patient connection.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    🟢 Identity Verified
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    🟣 Family Caregiver
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Relationship to Patient</label>
                  <input
                    type="text"
                    value={familyRel}
                    onChange={(e) => setFamilyRel(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={familyPatient}
                    onChange={(e) => setFamilyPatient(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    defaultValue="+91 98401 23456"
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs">
                <p className="text-purple-900 font-medium">
                  Badge Display Preview:
                </p>
                <p className="text-purple-800 text-xs mt-1">
                  «{familyName} • {familyRel} • 🟢 Identity Verified • 🟣 Family Caregiver»
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link href="/auth/login" className="text-xs text-muted-foreground hover:underline">
                  Sign in
                </Link>
                <Button asChild className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Link href="/caregiver">
                    Enter Family Caregiver Portal <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Registration Flow */}
        {selectedRole === 'patient' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                <Heart className="w-5 h-5 text-emerald-600" />
                Elderly Patient Registration & Profile
              </CardTitle>
              <CardDescription>
                Can be created by the patient directly or linked by family / attending doctor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Age & Date of Birth</label>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Preferred Language</label>
                  <input
                    type="text"
                    value={patientLang}
                    onChange={(e) => setPatientLang(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Primary Attending Doctor</label>
                  <input
                    type="text"
                    defaultValue="Dr. Vikram Malhotra (Cardiology)"
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link href="/auth/login" className="text-xs text-muted-foreground hover:underline">
                  Sign in
                </Link>
                <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/patient">
                    Enter Senior-Friendly Patient Portal <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
