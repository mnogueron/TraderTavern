import { Outlet } from 'react-router';
import { AppSidebar } from '@/components/app-sidebar';
import { PageHeader } from '@/components/PageHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import RequireAuth from '@/components/auth/RequireAuth';

export default function ProtectedLayout() {
  return (
    <RequireAuth>
      <SidebarProvider className="h-svh overflow-hidden bg-muted">
        <AppSidebar />
        <SidebarInset className="m-3 md:ml-0 overflow-hidden rounded-xl bg-card shadow-sm md:peer-data-[state=collapsed]:ml-2">
          <PageHeader />
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-4 pb-8">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RequireAuth>
  );
}
