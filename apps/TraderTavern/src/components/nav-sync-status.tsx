import { useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSidebar } from '@/components/ui/sidebar';
import { formatDateTime } from '@/lib/format';

export function NavSyncStatus() {
  const { state } = useSidebar();
  const { data } = useClientQuery('get', '/finance/sync/status');
  const lastSync = formatDateTime(data?.lastSyncDate ?? null);

  if (state === 'collapsed') {
    return (
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Last sync time"
              className="mx-auto"
            />
          }
        >
          <span className="size-2 rounded-full bg-emerald-500" />
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-auto">
          <span className="text-xs text-muted-foreground">
            Last sync: {lastSync}
          </span>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-xs">
      <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
      <span className="text-muted-foreground">Last sync</span>
      <span className="ml-auto font-medium tabular-nums">{lastSync}</span>
    </div>
  );
}
