import { useMemo } from 'react';
import type { VisibilityState } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { columns } from '@/pages/screener/components/columns';

type ColumnOption = {
  id: string;
  label: string;
};

const columnOptions: ColumnOption[] = columns
  .map((column) => {
    const id = 'accessorKey' in column ? String(column.accessorKey) : column.id;
    if (!id) return null;
    const label = column.meta?.label ?? id;
    return { id, label };
  })
  .filter((option): option is ColumnOption => option !== null);

type ColumnVisibilityPopoverProps = {
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (id: string, visible: boolean) => void;
};

const isVisible = (columnVisibility: VisibilityState, id: string) =>
  columnVisibility[id] !== false;

const ColumnVisibilityPopover = ({
  columnVisibility,
  onColumnVisibilityChange,
}: ColumnVisibilityPopoverProps) => {
  const { enabled, disabled } = useMemo(() => {
    const enabledOptions: ColumnOption[] = [];
    const disabledOptions: ColumnOption[] = [];
    for (const option of columnOptions) {
      if (isVisible(columnVisibility, option.id)) {
        enabledOptions.push(option);
      } else {
        disabledOptions.push(option);
      }
    }
    return { enabled: enabledOptions, disabled: disabledOptions };
  }, [columnVisibility]);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Columns
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64 p-0">
        <div className="max-h-80 overflow-y-auto p-1.5">
          {[...enabled, ...disabled].map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={isVisible(columnVisibility, option.id)}
                onCheckedChange={(checked) =>
                  onColumnVisibilityChange(option.id, checked)
                }
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnVisibilityPopover;
