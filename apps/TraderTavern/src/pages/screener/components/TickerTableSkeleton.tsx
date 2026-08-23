import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type TickerTableSkeletonProps = {
  rows: number;
};

const TickerTableSkeleton = ({ rows }: TickerTableSkeletonProps) => {
  return (
    <Table containerClassName="h-full" className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="sticky left-0 z-20 bg-background">
            Ticker
          </TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Industry</TableHead>
          <TableHead className="text-right">Market Cap</TableHead>
          <TableHead className="text-right">P/E</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead>Country</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, index) => (
          <TableRow key={index}>
            <TableCell className="sticky left-0 z-10 bg-background">
              <Skeleton className="h-4 w-14" />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                <Skeleton className="h-4 w-36" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="ml-auto h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="ml-auto h-4 w-10" />
            </TableCell>
            <TableCell>
              <Skeleton className="ml-auto h-4 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="ml-auto h-4 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TickerTableSkeleton;
