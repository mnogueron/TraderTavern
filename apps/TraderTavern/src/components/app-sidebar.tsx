import { NavCollapse } from '@/components/nav-collapse';
import { NavMain } from '@/components/nav-main';
import { NavSyncStatus } from '@/components/nav-sync-status';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { RiDashboardLine, RiSearchLine, RiNewspaperLine } from '@remixicon/react';

const navMain = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: <RiDashboardLine />,
  },
  {
    title: 'Screener',
    url: '/screener',
    icon: <RiSearchLine />,
  },
  {
    title: 'News',
    url: '/news',
    icon: <RiNewspaperLine />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <span className="px-2 py-1 text-sm font-semibold">Trader Tavern</span>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavSyncStatus />
        <NavCollapse />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
