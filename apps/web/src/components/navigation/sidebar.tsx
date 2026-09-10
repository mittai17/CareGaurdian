'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Heart, MessageSquare, Calendar,
  CheckSquare, BarChart2, Settings, HelpCircle, Shield,
  Activity, LogOut, Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/clinician', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/clinician/patients', icon: Users, label: 'Patients' },
  { href: '/clinician/care-circle', icon: Heart, label: 'Care Circle' },
  { href: '/clinician/reports', icon: Activity, label: 'Reports' },
  { href: '/clinician/prescriptions', icon: Pill, label: 'Prescriptions' },
  { href: '/clinician/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/clinician/caregivers', icon: Users, label: 'Caregivers' },
  { href: '/clinician/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/clinician/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/clinician/analytics', icon: BarChart2, label: 'Analytics' },
];

const bottomItems = [
  { href: '/clinician/settings', icon: Settings, label: 'Settings' },
  { href: '/help', icon: HelpCircle, label: 'Help & Support' },
];

import { useAuth } from '@/context/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName = user?.name || 'Dr. Vikram Malhotra';
  const displayRole = user?.roles?.[0] ? user.roles[0].replace('_', ' ') : 'Internal Medicine';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'DR';

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== '/clinician';
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-foreground tracking-tight">Baseline</span>
          <p className="text-[10px] text-muted-foreground leading-none">Health Memory Platform</p>
        </div>
      </div>

      {/* Doctor info */}
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{displayRole.toLowerCase()}</p>
          </div>
          <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
            <span className="sr-only">Online</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact) || (exact && pathname === '/clinician');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-primary' : '')} />
              {label}
              {label === 'Messages' && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                  3
                </span>
              )}
              {label === 'Tasks' && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white font-bold">
                  5
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-border px-3 py-3 space-y-0.5">
        {bottomItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
