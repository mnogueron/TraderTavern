import { NavCollapse } from '@/components/nav-collapse';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  RiDashboardLine,
  RiSearchLine,
  RiNewspaperLine,
  RiBookmarkLine,
} from '@remixicon/react';

const Logo = () => (
  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:text-xs">
    TT
  </div>
);

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
    title: 'Watchlists',
    url: '/watchlists',
    icon: <RiBookmarkLine />,
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
        <div className="flex items-center gap-2 px-2 py-1">
          <Logo />
          <span className="truncate text-base font-semibold group-data-[collapsible=icon]:hidden">
            TraderTavern
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavCollapse />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
