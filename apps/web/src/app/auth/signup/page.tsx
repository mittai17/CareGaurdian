'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const roles = [
  { value: 'CLINICIAN', label: 'Clinician / Doctor' },
  { value: 'PATIENT', label: 'Patient' },
  { value: 'FAMILY_CAREGIVER', label: 'Family Member / Friend' },
  { value: 'PROFESSIONAL_CAREGIVER', label: 'Professional Caregiver' },
  { value: 'GUARDIAN', label: 'Guardian / Legal Representative' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
];

export default function SignupPage() {
  const [role, setRole] = useState('CLINICIAN');
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Account created!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Check your email to verify your account before signing in.
            </p>
            <Button asChild className="w-full">
              <Link href="/clinician">Continue to Dashboard →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold">Baseline</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <p className="text-sm text-muted-foreground">Join Baseline — privacy-first health memory platform</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">First name</label>
                  <input required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Last name</label>
                  <input required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" required className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input type="password" required minLength={8} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="8+ characters" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Your role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {role === 'CLINICIAN' && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                  Clinicians require professional verification before accessing patient records. This is separate from account creation.
                </div>
              )}
              <Button type="submit" className="w-full" size="lg">Create Account</Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
