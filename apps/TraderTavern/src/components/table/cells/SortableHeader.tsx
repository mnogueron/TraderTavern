import type { Column } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortableHeaderProps<TData> = {
  column: Column<TData, unknown>;
  label: string;
  align?: 'left' | 'right';
};

const SortableHeader = <TData,>({
  column,
  label,
  align = 'left',
}: SortableHeaderProps<TData>) => (
  <div className={align === 'right' ? 'text-right' : undefined}>
    <Button
      variant="ghost"
      className="-ml-3 h-7 text-xs"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
    </Button>
  </div>
);

export default SortableHeader;
