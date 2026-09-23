import { useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { RiAddLine, RiBookmarkLine } from '@remixicon/react';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import WatchlistFormDialog from '@/pages/watchlist/components/WatchlistFormDialog';

const WatchlistsPage = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: watchlists, isPending } = useClientQuery(
    'get',
    '/api/watchlists',
  );

  const createMutation = useClientMutation('post', '/api/watchlists', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get', '/api/watchlists'] });
      setCreateOpen(false);
    },
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : !watchlists || watchlists.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <RiBookmarkLine className="size-8" />
          <p className="text-sm">No watchlists yet.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCreateOpen(true)}
          >
            Create your first watchlist
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {watchlists.map((watchlist) => (
            <Link key={watchlist.id} to={`/watchlists/${watchlist.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{watchlist.name}</CardTitle>
                  <CardDescription>
                    {watchlist.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">
                    {watchlist.tickers.length}{' '}
                    {watchlist.tickers.length === 1 ? 'ticker' : 'tickers'}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-full min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-input text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <RiAddLine className="size-5" />
            <span className="text-sm font-medium">New watchlist</span>
          </button>
        </div>
      )}

      <WatchlistFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New watchlist"
        isSubmitting={createMutation.isPending}
        onSubmit={(values) => createMutation.mutate({ body: values })}
      />
    </div>
  );
};

export default WatchlistsPage;
