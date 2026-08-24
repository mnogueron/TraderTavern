import { useNavigate } from 'react-router';
import { useClientMutation } from '@trader-tavern/api-client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTheme } from '@/hooks/useTheme';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  RiArrowUpDownLine,
  RiSettingsLine,
  RiLogoutBoxLine,
  RiTeamLine,
  RiMoonLine,
  RiSunLine,
} from '@remixicon/react';

export function NavUser() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { theme, toggleTheme } = useTheme();

  const logoutMutation = useClientMutation('post', '/auth/logout', {
    onSuccess: () => navigate('/login'),
  });

  if (!currentUser) {
    return null;
  }

  const initials = currentUser.username.slice(0, 2).toUpperCase();
  const isAdmin = currentUser.role === 'admin';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{currentUser.username}</span>
              <span className="truncate text-xs">{currentUser.email}</span>
            </div>
            <RiArrowUpDownLine className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{currentUser.username}</span>
                    <span className="truncate text-xs">{currentUser.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/users')}>
                  <RiTeamLine />
                  Users
                </DropdownMenuItem>
              )}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <RiSettingsLine />
                  Settings
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'dark' ? <RiSunLine /> : <RiMoonLine />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutMutation.mutate({})}>
              <RiLogoutBoxLine />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
