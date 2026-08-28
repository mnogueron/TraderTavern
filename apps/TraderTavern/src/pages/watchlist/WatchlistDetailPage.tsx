import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { RiAddLine, RiArrowLeftLine, RiDeleteBinLine, RiPencilLine } from '@remixicon/react';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import TickerTable from '@/pages/screener/components/TickerTable';
import TickerTableSkeleton from '@/pages/screener/components/TickerTableSkeleton';
import AddTickerDialog from '@/pages/watchlist/components/AddTickerDialog';
import DeleteWatchlistDialog from '@/pages/watchlist/components/DeleteWatchlistDialog';
import WatchlistFormDialog, {
  type WatchlistFormValues,
} from '@/pages/watchlist/components/WatchlistFormDialog';

type WatchlistDetailPageProps = {
  watchlistId: string;
};

const WatchlistDetailPage = ({ watchlistId }: WatchlistDetailPageProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: watchlist, isPending: isWatchlistPending } = useClientQuery(
    'get',
    '/watchlists/{id}',
    { params: { path: { id: watchlistId } } },
  );

  const tickers = watchlist?.tickers ?? [];

  const { data: tickerData, isPending: isTickersPending } = useClientQuery(
    'get',
    '/finance/tickers',
    { params: { query: { tickers: tickers.join(',') } } },
    { enabled: tickers.length > 0 },
  );

  const watchlistQueryKey = ['get', '/watchlists/{id}', { params: { path: { id: watchlistId } } }];

  const updateMutation = useClientMutation('patch', '/watchlists/{id}', {
    onSuccess: (data) => {
      queryClient.setQueryData(watchlistQueryKey, data);
      queryClient.invalidateQueries({ queryKey: ['get', '/watchlists'] });
      setEditOpen(false);
    },
  });

  const deleteMutation = useClientMutation('delete', '/watchlists/{id}', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get', '/watchlists'] });
      navigate('/watchlists');
    },
  });

  const addTickerMutation = useClientMutation('post', '/watchlists/{id}/tickers', {
    onSuccess: (data) => {
      queryClient.setQueryData(watchlistQueryKey, data);
    },
  });

  const handleAddTicker = (ticker: string) => {
    addTickerMutation.mutate({
      params: { path: { id: watchlistId } },
      body: { ticker },
    });
  };

  const handleUpdate = (values: WatchlistFormValues) => {
    updateMutation.mutate({
      params: { path: { id: watchlistId } },
      body: values,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ params: { path: { id: watchlistId } } });
  };

  if (isWatchlistPending || !watchlist) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link to="/watchlists" />}>
          <RiArrowLeftLine />
        </Button>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-2xl font-semibold">{watchlist.name}</h1>
          {watchlist.description && (
            <span className="truncate text-sm text-muted-foreground">
              {watchlist.description}
            </span>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <RiAddLine data-icon="inline-start" />
            Add
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <RiPencilLine data-icon="inline-start" />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <RiDeleteBinLine data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </div>

      <div className="min-h-[600px] flex-1 overflow-hidden rounded-md border">
        {tickers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">No tickers in this watchlist yet.</p>
            <Button type="button" variant="outline" onClick={() => setAddOpen(true)}>
              Add a ticker
            </Button>
          </div>
        ) : isTickersPending || !tickerData ? (
          <TickerTableSkeleton rows={tickers.length} />
        ) : (
          <TickerTable
            tickers={tickerData}
            sorting={[]}
            onSortingChange={() => undefined}
            columnVisibility={{}}
          />
        )}
      </div>

      <AddTickerDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        excludeTickers={tickers}
        onSelect={handleAddTicker}
      />
      <WatchlistFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit watchlist"
        initialValues={{
          name: watchlist.name,
          description: watchlist.description ?? '',
        }}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleUpdate}
      />
      <DeleteWatchlistDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        watchlistName={watchlist.name}
        isSubmitting={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default WatchlistDetailPage;
