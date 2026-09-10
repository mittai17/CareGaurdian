'use client';

import { Sidebar } from '@/components/navigation/sidebar';
import { Search } from 'lucide-react';

export default function CaregiverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-64">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                🟢 Identity Verified
              </span>
              <span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/20">
                🔵 Family Caregiver
              </span>
            </div>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div
                title="Karthik Sundaram"
                className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold border border-primary/30"
              >
                KS
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl w-full mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
