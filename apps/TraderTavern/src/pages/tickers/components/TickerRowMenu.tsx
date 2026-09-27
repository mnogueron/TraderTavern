import {
  RiMoreLine,
  RiForbidLine,
  RiCheckboxCircleLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiEyeLine,
} from '@remixicon/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { components } from '@trader-tavern/api-client';

type TickerSummary = components['schemas']['TickerSummaryDto'];

type TickerRowMenuProps = {
  ticker: TickerSummary;
  onToggleStatus: () => void;
  onSync: () => void;
  onDelete: () => void;
  onShowDetails: () => void;
};

const TickerRowMenu = ({
  ticker,
  onToggleStatus,
  onSync,
  onDelete,
  onShowDetails,
}: TickerRowMenuProps) => {
  const isActive = ticker.status === 'active';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="ghost" size="icon-sm" />}
      >
        <RiMoreLine />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onShowDetails}>
          <RiEyeLine />
          Show details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSync}>
          <RiRefreshLine />
          Sync now
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleStatus}>
          {isActive ? <RiForbidLine /> : <RiCheckboxCircleLine />}
          {isActive ? 'Disable' : 'Enable'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <RiDeleteBinLine />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TickerRowMenu;
