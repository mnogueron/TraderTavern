import { RiArrowLeftSLine, RiSideBarLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function NavCollapse() {
  const { state, toggleSidebar } = useSidebar();

  if (state === 'collapsed') {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Expand navbar"
        className="mx-auto"
        onClick={toggleSidebar}
      >
        <RiSideBarLine />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={toggleSidebar}
    >
      <RiArrowLeftSLine data-icon="inline-start" />
      Collapse navbar
    </Button>
  );
}
