import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Heart, Brain, Users, Activity, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Baseline — AI-Powered Persistent Health Memory',
  description: 'Understand what changed before it becomes a crisis. AI-powered persistent health memory for elderly patients with Care Circle.',
};

const features = [
  { icon: Brain, title: 'Personal Health Memory', desc: 'Combines medical records, medications, labs, and family observations into one longitudinal memory.' },
  { icon: Users, title: 'Private Care Circle', desc: 'Family, friends, neighbors, and caregivers privately report what they notice — in their own words.' },
  { icon: Activity, title: 'Year-by-Year Timeline', desc: 'See health history year-by-year. Click any year to explore events, changes, and evidence.' },
  { icon: Heart, title: 'Personal Baseline', desc: "Never compared to population averages. Understands what's normal for this specific person." },
  { icon: Shield, title: 'Privacy-First', desc: 'You control who sees what. Granular consent. Audit log for every access.' },
  { icon: CheckCircle, title: 'Evidence-Backed AI', desc: 'Every AI statement has evidence. Sources, dates, original text. Never invents data.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Baseline</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild><Link href="/auth/login">Log in</Link></Button>
            <Button asChild><Link href="/auth/signup">Get started</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-blue-50 border-blue-200 px-4 py-1.5 text-sm text-blue-700 mb-8">
          🔬 Demo mode — synthetic data only
        </div>
        <h1 className="text-5xl font-bold text-foreground leading-tight mb-6">
          Understand what changed<br />
          <span className="text-primary">before it becomes a crisis.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Baseline is a privacy-preserving health memory platform for elderly people.
          It combines medical records, family observations, and personal history into a single longitudinal view.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/clinician">View Demo Dashboard <ChevronRight className="ml-1.5 h-5 w-5" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/signup">Create Account</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What makes Baseline different</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Not an EHR. Not a chatbot. Not a social network. A persistent personal health memory with a private Care Circle.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-white p-6 card-hover">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to see it in action?</h2>
        <p className="text-muted-foreground mb-8">Open the demo dashboard to see Ravi Kumar&apos;s complete health memory.</p>
        <Button size="lg" asChild>
          <Link href="/clinician">Open Demo Dashboard →</Link>
        </Button>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Baseline. AI-Powered Persistent Health Memory.</p>
        <p className="mt-1 text-xs">All demo data is synthetic. No real patient information is present.</p>
      </footer>
    </div>
  );
}
