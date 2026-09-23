import { useState, type DragEvent } from 'react';
import type { VisibilityState } from '@tanstack/react-table';
import { GripVertical, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { columnMetaById } from '@/pages/screener/components/columns';

type ColumnVisibilityPopoverProps = {
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (id: string, visible: boolean) => void;
  columnOrder: string[];
  onColumnOrderChange: (order: string[]) => void;
  onReset: () => void;
};

const isVisible = (columnVisibility: VisibilityState, id: string) =>
  columnVisibility[id] !== false;

const ColumnVisibilityPopover = ({
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  onReset,
}: ColumnVisibilityPopoverProps) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const isSearching = search.trim().length > 0;

  const visibleColumnOrder = isSearching
    ? columnOrder.filter((id) => {
        const meta = columnMetaById.get(id);
        return meta?.label.toLowerCase().includes(search.trim().toLowerCase());
      })
    : columnOrder;

  const handleDragStart = (id: string) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (id: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDrop = (targetId: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const next = [...columnOrder];
    const from = next.indexOf(draggedId);
    const to = next.indexOf(targetId);
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    onColumnOrderChange(next);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleVisibilityChange = (id: string, visible: boolean) => {
    onColumnVisibilityChange(id, visible);
    if (!visible) return;

    const rest = columnOrder.filter((columnId) => columnId !== id);
    let lastVisibleIndex = -1;
    rest.forEach((columnId, index) => {
      if (isVisible(columnVisibility, columnId)) {
        lastVisibleIndex = index;
      }
    });
    const next = [...rest];
    next.splice(lastVisibleIndex + 1, 0, id);
    onColumnOrderChange(next);
    setSearch('');
  };

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
      <PopoverContent align="end" className="w-56 p-0">
        <div className="flex items-center gap-1.5 border-b p-1.5">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search columns..."
            className="h-7 text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {visibleColumnOrder.map((id) => {
            const meta = columnMetaById.get(id);
            if (!meta) return null;
            const draggable = !meta.sticky && !isSearching;
            return (
              <div
                key={id}
                draggable={draggable}
                onDragStart={draggable ? handleDragStart(id) : undefined}
                onDragOver={draggable ? handleDragOver(id) : undefined}
                onDrop={draggable ? handleDrop(id) : undefined}
                onDragEnd={draggable ? handleDragEnd : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs hover:bg-accent',
                  draggedId === id && 'opacity-50',
                  dragOverId === id && 'bg-accent',
                )}
              >
                <GripVertical
                  className={cn(
                    'h-3 w-3 shrink-0 text-muted-foreground',
                    draggable ? 'cursor-grab' : 'invisible',
                  )}
                />
                <label className="flex flex-1 items-center gap-1.5 truncate">
                  <Checkbox
                    checked={isVisible(columnVisibility, id)}
                    onCheckedChange={(checked) =>
                      handleVisibilityChange(id, checked)
                    }
                    className="size-3.5"
                  />
                  <span className="truncate">{meta.label}</span>
                </label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnVisibilityPopover;
