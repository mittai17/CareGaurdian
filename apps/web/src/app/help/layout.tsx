import { Sidebar } from '@/components/navigation/sidebar';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-64">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search help articles, guides, emergency workflows…"
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold cursor-pointer">
              PS
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
