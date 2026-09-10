import { Sidebar } from '@/components/navigation/sidebar';
import { ClinicianTopbar } from '@/components/navigation/clinician-topbar';

export default function ClinicianLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden pl-64">
        <ClinicianTopbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
