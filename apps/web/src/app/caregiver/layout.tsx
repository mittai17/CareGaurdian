'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Heart,
  CheckSquare,
  Bell,
  MessageSquare,
  User,
  LogOut,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navs = [
    { href: '/caregiver', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/caregiver#patient-overview', label: 'Patient', icon: Heart },
    { href: '/caregiver#tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/caregiver#reminders', label: 'Reminders', icon: Bell },
    { href: '/clinician/messages', label: 'Messages', icon: MessageSquare },
    { href: '/clinician/settings', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-white px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/caregiver" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base text-foreground tracking-tight">CareGuardian</span>
              <span className="text-[10px] block text-purple-600 font-semibold uppercase tracking-wider">Family Caregiver Mode</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 pl-4">
            {navs.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                      : 'text-muted-foreground hover:text-foreground hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-l pl-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                🟢 Identity Verified
              </span>
              <span className="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                🟣 Family Caregiver
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs ml-1">
              KS
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-foreground leading-tight">Karthik Sundaram</p>
              <p className="text-[10px] text-muted-foreground">Son of Patient</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('baseline_token');
              router.push('/auth/login');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-2"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
