'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('dr.priya.sharma@careguardian.health');
  const [password, setPassword] = useState('CareSafe2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email.trim(), password);
      const token = res.accessToken || res.data?.accessToken;
      const user = res.user || res.data?.user;
      if (token) {
        localStorage.setItem('baseline_token', token);
      }
      if (user) {
        localStorage.setItem('baseline_user', JSON.stringify(user));
        const roles = user.roles || (user.role ? [user.role] : []);
        if (roles.includes('PATIENT')) {
          window.location.href = '/patient';
        } else if (roles.includes('FAMILY_CAREGIVER') || roles.includes('PROFESSIONAL_CAREGIVER')) {
          window.location.href = '/caregiver';
        } else {
          window.location.href = '/clinician';
        }
      } else {
        window.location.href = '/clinician';
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(
        err?.response?.data?.message ||
        (typeof err === 'string' ? err : 'Invalid email or password. Please check your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold">Baseline</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in to Baseline</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Health memory platform for clinical teams
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 mb-4 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" defaultChecked />
                  Remember me
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Quick Role Switcher
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('dr.vikram.malhotra@careguardian.health');
                    setPassword('CareSafe2026!');
                  }}
                  className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-left transition-colors"
                >
                  <p className="font-semibold text-foreground">Dr. Vikram Malhotra</p>
                  <p className="text-[10px] text-muted-foreground">Doctor / Clinician</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('dr.priya.sharma@careguardian.health');
                    setPassword('CareSafe2026!');
                  }}
                  className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-left transition-colors"
                >
                  <p className="font-semibold text-foreground">Dr. Priya Sharma</p>
                  <p className="text-[10px] text-muted-foreground">Doctor / Clinician</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('karthik.sundaram@careguardian.health');
                    setPassword('CareSafe2026!');
                  }}
                  className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-left transition-colors"
                >
                  <p className="font-semibold text-foreground">Karthik Sundaram</p>
                  <p className="text-[10px] text-muted-foreground">Family Caregiver</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('devaki.sundaram@careguardian.health');
                    setPassword('CareSafe2026!');
                  }}
                  className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-left transition-colors"
                >
                  <p className="font-semibold text-foreground">Devaki Sundaram</p>
                  <p className="text-[10px] text-muted-foreground">Patient (Elderly)</p>
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
