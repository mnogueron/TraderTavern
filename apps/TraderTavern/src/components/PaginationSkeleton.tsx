import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PaginationSkeletonProps = {
  className?: string;
};

export function PaginationSkeleton({ className }: PaginationSkeletonProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}
