import { cn } from '@/lib/utils';

export function TableFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2',
        className,
      )}
      {...props}
    />
  );
}
