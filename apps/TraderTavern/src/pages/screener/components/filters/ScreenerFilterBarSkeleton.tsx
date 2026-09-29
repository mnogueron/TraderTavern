import { CardSurface } from '@/components/CardSurface';
import { SectionContent } from '@/components/Section';
import { Skeleton } from '@/components/ui/skeleton';

const ScreenerFilterBarSkeleton = () => {
  return (
    <CardSurface className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2">
        <Skeleton className="h-5 w-14" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="size-6" />
        </div>
      </div>
      <SectionContent className="flex flex-col gap-3 p-2">
        <div className="flex h-8 items-center gap-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-10" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-3 gap-y-1.5 p-2">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
        </div>
      </SectionContent>
    </CardSurface>
  );
};

export default ScreenerFilterBarSkeleton;
