import { RiSideBarLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function NavCollapse() {
  const { state, toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={state === 'collapsed' ? 'Expand navbar' : 'Collapse navbar'}
      onClick={toggleSidebar}
    >
      <RiSideBarLine />
    </Button>
  );
}
