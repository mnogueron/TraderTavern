import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type CancelSyncDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

const CancelSyncDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: CancelSyncDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Cancel this sync</DialogTitle>
        <DialogDescription>
          This marks the sync as cancelled, freeing its lock so a new sync
          can start. Only do this if you're sure the job is actually stuck
          (e.g. orphaned after a server restart) — a genuinely in-progress
          sync will be interrupted.
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
          Cancel sync
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default CancelSyncDialog;
