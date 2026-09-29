import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type TickersTableSkeletonProps = {
  rows: number;
};

const COLUMNS = ['Company', 'ISIN', 'Market', 'Status', 'Last sync', ''];

const TickersTableSkeleton = ({ rows }: TickersTableSkeletonProps) => (
  <Table containerClassName="min-h-0 flex-1" className="text-xs">
    <TableHeader>
      <TableRow>
        {COLUMNS.map((label, index) => (
          <TableHead key={index}>{label}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody className="bg-card">
      {Array.from({ length: rows }, (_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 shrink-0 rounded-md" />
              <Skeleton className="h-4 w-36" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-4 rounded-sm" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default TickersTableSkeleton;
