import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type WatchlistFormValues = {
  name: string;
  description: string;
};

const EMPTY_VALUES: WatchlistFormValues = { name: '', description: '' };

type WatchlistFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValues?: WatchlistFormValues;
  isSubmitting?: boolean;
  onSubmit: (values: WatchlistFormValues) => void;
};

const WatchlistFormDialog = ({
  open,
  onOpenChange,
  title,
  initialValues,
  isSubmitting,
  onSubmit,
}: WatchlistFormDialogProps) => {
  const [values, setValues] = useState<WatchlistFormValues>(
    initialValues ?? EMPTY_VALUES,
  );

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? EMPTY_VALUES);
    }
  }, [open, initialValues]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!values.name.trim()) {
      return;
    }
    onSubmit({ name: values.name.trim(), description: values.description.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="watchlist-name">Name</Label>
            <Input
              id="watchlist-name"
              value={values.name}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, name: event.target.value }))
              }
              maxLength={100}
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="watchlist-description">Description (optional)</Label>
            <Textarea
              id="watchlist-description"
              value={values.description}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, description: event.target.value }))
              }
              maxLength={500}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !values.name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WatchlistFormDialog;
