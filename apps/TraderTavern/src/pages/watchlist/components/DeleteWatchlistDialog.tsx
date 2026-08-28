import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DeleteWatchlistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlistName: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
};

const DeleteWatchlistDialog = ({
  open,
  onOpenChange,
  watchlistName,
  isSubmitting,
  onConfirm,
}: DeleteWatchlistDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete watchlist</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{watchlistName}"? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isSubmitting} onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteWatchlistDialog;
