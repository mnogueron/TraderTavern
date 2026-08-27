import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RiRefreshLine } from '@remixicon/react';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import FileDropzone from '@/pages/settings/components/FileDropzone';
import { formatDateTime } from '@/lib/format';

type TickerSource = 'yahoo' | 'xtb';

const TICKER_SOURCE_OPTIONS: { value: TickerSource; label: string }[] = [
  { value: 'yahoo', label: 'Yahoo Finance' },
  { value: 'xtb', label: 'XTB (OMI)' },
];

const TickerSourceSettings = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [selectedSource, setSelectedSource] = useState<TickerSource>(
    currentUser?.tickerSource ?? 'yahoo',
  );

  const isAdmin = currentUser?.role === 'admin';

  const { data: syncStatus, isPending: isSyncStatusPending } = useClientQuery(
    'get',
    '/ticker-source/{source}/sync/status',
    { params: { path: { source: selectedSource } } },
  );

  const updateSettingsMutation = useClientMutation('patch', '/user/me/settings', {
    onSuccess: (user) => {
      queryClient.setQueryData(['get', '/auth/me'], user);
    },
  });

  const syncYahooMutation = useClientMutation('post', '/ticker-source/yahoo/sync', {
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['get', '/ticker-source/{source}/sync/status'],
      }),
  });

  const [uploadError, setUploadError] = useState<string | null>(null);
  const syncXtbMutation = useClientMutation('post', '/ticker-source/xtb/sync/upload', {
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({
        queryKey: ['get', '/ticker-source/{source}/sync/status'],
      });
    },
    onError: () => setUploadError('Failed to process the uploaded OMI file.'),
  });

  const handleSourceChange = (value: TickerSource | null) => {
    if (!value) {
      return;
    }
    setSelectedSource(value);
    updateSettingsMutation.mutate({ body: { tickerSource: value } });
  };

  const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    syncXtbMutation.mutate({
      body: formData as unknown as { file: string },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticker-source">Ticker source</Label>
        <Select value={selectedSource} onValueChange={handleSourceChange}>
          <SelectTrigger id="ticker-source" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKER_SOURCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Determines which provider the screener resolves ticker data from.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Last update</span>
          {isSyncStatusPending ? (
            <Skeleton className="mt-1 h-4 w-32" />
          ) : (
            <span className="text-sm tabular-nums">
              {formatDateTime(syncStatus?.sourceUpdatedAt ?? null)}
            </span>
          )}
        </div>
        {isAdmin && selectedSource === 'yahoo' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={syncYahooMutation.isPending || syncStatus?.isSyncing}
            onClick={() => syncYahooMutation.mutate({})}
          >
            <RiRefreshLine
              className={
                syncYahooMutation.isPending || syncStatus?.isSyncing
                  ? 'animate-spin'
                  : undefined
              }
            />
            Sync now
          </Button>
        )}
      </div>

      {isAdmin && selectedSource === 'xtb' && (
        <div className="flex flex-col gap-1.5">
          <FileDropzone
            label={
              syncXtbMutation.isPending
                ? 'Processing…'
                : 'Drop the OMI PDF here, or click to browse'
            }
            hint="XTB's quarterly Specification Table Organised Market Instruments (OMI) PDF"
            accept="application/pdf"
            disabled={syncXtbMutation.isPending || syncStatus?.isSyncing}
            onFileSelected={handleFileSelected}
          />
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TickerSourceSettings;
