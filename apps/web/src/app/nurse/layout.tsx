'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileSpreadsheet,
  MessageSquare,
  User,
  ShieldCheck,
  LogOut,
  Bell,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function NurseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/nurse', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/clinician/patients', icon: Users, label: 'Patients' },
    { href: '/clinician/tasks', icon: CheckSquare, label: 'Tasks' },
    { href: '/nurse/handover', icon: FileSpreadsheet, label: 'Handover' },
    { href: '/clinician/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/clinician/settings', icon: User, label: 'Profile' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== '/nurse';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/nurse" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base text-foreground tracking-tight">CareGuardian</span>
              <span className="text-[10px] block text-blue-600 font-semibold uppercase tracking-wider">Clinical Nurse Portal</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 pl-4">
            {navItems.map(({ href, icon: Icon, label, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'text-muted-foreground hover:text-foreground hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-l pl-4">
            <Badge className="bg-blue-100 text-blue-900 border-blue-300 font-semibold text-xs gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              Verified Nurse (RN-441209)
            </Badge>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-foreground">Sister Mary Joseph, RN</p>
              <p className="text-[10px] text-muted-foreground font-mono">@nurse_mary</p>
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

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
