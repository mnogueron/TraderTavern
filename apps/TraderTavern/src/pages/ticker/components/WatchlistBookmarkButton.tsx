import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RiAddLine, RiBookmarkFill, RiBookmarkLine } from '@remixicon/react';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import WatchlistFormDialog, {
  type WatchlistFormValues,
} from '@/pages/watchlist/components/WatchlistFormDialog';

type WatchlistBookmarkButtonProps = {
  ticker: string;
};

const WatchlistBookmarkButton = ({ ticker }: WatchlistBookmarkButtonProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: watchlists } = useClientQuery('get', '/watchlists', {}, { enabled: open });
  const { data: membership } = useClientQuery(
    'get',
    '/watchlists/membership/{ticker}',
    { params: { path: { ticker } } },
    { enabled: open },
  );

  const membershipQueryKey = [
    'get',
    '/watchlists/membership/{ticker}',
    { params: { path: { ticker } } },
  ];

  const setMembershipMutation = useClientMutation('put', '/watchlists/membership/{ticker}', {
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(membershipQueryKey, {
        watchlistIds: variables.body.watchlistIds,
      });
    },
  });

  const createMutation = useClientMutation('post', '/watchlists', {
    onSuccess: (watchlist) => {
      queryClient.invalidateQueries({ queryKey: ['get', '/watchlists'] });
      const nextIds = [...(membership?.watchlistIds ?? []), watchlist.id];
      setMembershipMutation.mutate({
        params: { path: { ticker } },
        body: { watchlistIds: nextIds },
      });
      setCreateOpen(false);
    },
  });

  const watchlistIds = membership?.watchlistIds ?? [];
  const isBookmarked = watchlistIds.length > 0;

  const toggleWatchlist = (id: string) => {
    const next = watchlistIds.includes(id)
      ? watchlistIds.filter((value) => value !== id)
      : [...watchlistIds, id];
    setMembershipMutation.mutate({
      params: { path: { ticker } },
      body: { watchlistIds: next },
    });
  };

  const handleCreate = (values: WatchlistFormValues) => {
    createMutation.mutate({ body: values });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon-sm" aria-label="Manage watchlists" />
          }
        >
          {isBookmarked ? <RiBookmarkFill /> : <RiBookmarkLine />}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search watchlists..." />
            <CommandList>
              {!watchlists || watchlists.length === 0 ? (
                <CommandEmpty>No watchlists yet.</CommandEmpty>
              ) : (
                watchlists.map((watchlist) => (
                  <CommandItem
                    key={watchlist.id}
                    value={watchlist.name}
                    onSelect={() => toggleWatchlist(watchlist.id)}
                    className="gap-2"
                  >
                    <Checkbox checked={watchlistIds.includes(watchlist.id)} />
                    <span className="truncate">{watchlist.name}</span>
                  </CommandItem>
                ))
              )}
            </CommandList>
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false);
                  setCreateOpen(true);
                }}
              >
                <RiAddLine data-icon="inline-start" />
                New watchlist
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <WatchlistFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New watchlist"
        isSubmitting={createMutation.isPending}
        onSubmit={handleCreate}
      />
    </>
  );
};

export default WatchlistBookmarkButton;
