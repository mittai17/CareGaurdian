'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Pill,
  Calendar,
  Users,
  AlertOctagon,
  User,
  LogOut,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navs = [
    { href: '/patient', label: 'Home', icon: Home },
    { href: '/patient#medicines', label: 'Medicines', icon: Pill },
    { href: '/patient#appointments', label: 'Appointments', icon: Calendar },
    { href: '/patient#caregiver', label: 'Caregiver', icon: Users },
    { href: '/patient#emergency', label: 'Emergency', icon: AlertOctagon, isEmergency: true },
    { href: '/clinician/settings', label: 'Profile', icon: User },
  ];

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const text = "Welcome to your health portal. Today you have three medicines scheduled, and Dr. Vikram Malhotra is monitoring your heart recovery. If you need help, press the big red emergency button.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/20 text-slate-900 flex flex-col font-sans">
      {/* High-Contrast Accessible Header */}
      <header className="sticky top-0 z-40 border-b-2 border-slate-300 bg-white px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/patient" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow">
              <Home className="h-7 w-7" />
            </div>
            <div>
              <span className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight">CareGuardian</span>
              <span className="text-xs block text-emerald-800 font-bold uppercase tracking-wider">Senior Care Home</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-2 pl-4">
            {navs.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 rounded-xl font-bold text-base transition-colors flex items-center gap-2 ${
                    item.isEmergency
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                      : active
                      ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-600'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Voice Assistance Button */}
          <Button
            onClick={handleSpeak}
            variant="outline"
            className="h-11 px-3 border-2 border-emerald-600 text-emerald-800 font-bold text-sm gap-2 hover:bg-emerald-50 rounded-xl"
            title="Read screen aloud"
          >
            <Volume2 className="w-5 h-5 text-emerald-700" />
            <span className="hidden sm:inline">Read Aloud</span>
          </Button>

          <div className="hidden sm:flex items-center gap-2.5 border-l-2 pl-3">
            <div className="h-10 w-10 rounded-full bg-emerald-200 text-emerald-950 font-bold flex items-center justify-center text-sm border border-emerald-400">
              DS
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 leading-tight">Devaki Sundaram</p>
              <p className="text-xs text-slate-500 font-semibold">Age 72 • Patient</p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              localStorage.removeItem('baseline_token');
              router.push('/auth/login');
            }}
            className="text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 ml-1 font-bold"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Exit
          </Button>
        </div>
      </header>

      {/* Main Body with Extra Accessible Sizing */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
