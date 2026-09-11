'use client';

import { Sidebar } from '@/components/navigation/sidebar';
import { Search, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NurseLayout({ children }: { children: React.ReactNode }) {
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
            <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold text-xs gap-1 hidden sm:flex">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Verified Nurse (RN-441209)
            </Badge>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div className="hidden sm:block text-right mr-2">
                <p className="text-xs font-semibold text-foreground">Sister Mary Joseph, RN</p>
                <p className="text-[10px] text-muted-foreground font-mono">@nurse_mary</p>
              </div>
              <div
                title="Sister Mary Joseph, RN"
                className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold border border-primary/30"
              >
                MJ
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
