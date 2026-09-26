import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type DeleteTickerDialogProps = {
  ticker: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

const DeleteTickerDialog = ({
  ticker,
  onOpenChange,
  onConfirm,
  isPending,
}: DeleteTickerDialogProps) => (
  <Dialog open={!!ticker} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete {ticker}</DialogTitle>
        <DialogDescription>
          This permanently removes all stored data for this ticker (static
          data, financials, technicals, history and sync health). If it's
          still part of a configured ticker source, it will be recreated on
          the next sync.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          Delete ticker
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default DeleteTickerDialog;
