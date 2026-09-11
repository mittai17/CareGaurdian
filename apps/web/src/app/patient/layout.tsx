'use client';

import Link from 'next/link';
import { Sidebar } from '@/components/navigation/sidebar';
import { Volume2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const text = "Welcome to your health portal. Today you have three medicines scheduled, and Dr. Vikram Malhotra is monitoring your heart recovery. If you need help, press the big red emergency button.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-64">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            {/* Keeping it consistent with clinician top bar, although search might be disabled for patients. */}
            <div className="relative flex-1 opacity-50 pointer-events-none hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                disabled
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Global Read Aloud */}
            <Button
              onClick={handleSpeak}
              variant="outline"
              size="sm"
              className="border-primary text-primary font-bold gap-2 hover:bg-primary/10"
              title="Read screen aloud"
            >
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Read Aloud</span>
            </Button>

            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div
                title="Devaki Sundaram"
                className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold border border-primary/30"
              >
                DS
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {/* Constrain width to 5xl for better readability for patients */}
          <div className="max-w-5xl w-full mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
