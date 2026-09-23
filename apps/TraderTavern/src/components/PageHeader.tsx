import { useMatches } from 'react-router';
import { SidebarTrigger } from '@/components/ui/sidebar';

type RouteHandle = {
  title?: string;
};

export function PageHeader() {
  const matches = useMatches();
  const title = [...matches]
    .reverse()
    .map((match) => (match.handle as RouteHandle | undefined)?.title)
    .find((value) => Boolean(value));

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1 md:hidden" />
      {title && <h1 className="text-xl font-semibold">{title}</h1>}
    </header>
  );
}
