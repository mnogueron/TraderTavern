import { cn } from '@/lib/utils';

type PageRangeSummaryProps = {
  page: number;
  pageSize: number;
  total: number;
  className?: string;
};

export function PageRangeSummary({
  page,
  pageSize,
  total,
  className,
}: PageRangeSummaryProps) {
  if (total === 0) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        0 results
      </span>
    );
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <span className={cn('text-sm text-muted-foreground', className)}>
      {start}-{end} of {total}
    </span>
  );
}
