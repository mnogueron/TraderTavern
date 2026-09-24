import { NavCollapse } from '@/components/nav-collapse';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import {
  RiDashboardLine,
  RiSearchLine,
  RiNewspaperLine,
  RiBookmarkLine,
  RiCloseLine,
} from '@remixicon/react';

const Logo = ({ large }: { large?: boolean }) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:text-xs',
      large ? 'size-9 text-base' : 'size-8 text-sm',
    )}
  >
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
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:flex-col">
          <div className="flex items-center gap-2">
            <Logo large={isMobile} />
            <span
              className={cn(
                'truncate font-semibold group-data-[collapsible=icon]:hidden',
                isMobile ? 'text-lg' : 'text-base',
              )}
            >
              TraderTavern
            </span>
          </div>
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close menu"
              onClick={() => setOpenMobile(false)}
            >
              <RiCloseLine className="size-5" />
            </Button>
          ) : (
            <NavCollapse />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
