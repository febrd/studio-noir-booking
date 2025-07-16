
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ModernHeader } from './ModernHeader';
import { MobileNavigation } from './MobileNavigation';

interface ModernLayoutProps {
  children: React.ReactNode;
}

export function ModernLayout({ children }: ModernLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <ModernHeader />
          <main className="flex-1 space-y-4 p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
          <MobileNavigation />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
