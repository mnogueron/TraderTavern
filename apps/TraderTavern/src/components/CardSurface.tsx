import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function CardSurface({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-surface"
      className={cn(
        'rounded-xl bg-card text-sm text-card-foreground ring-1 ring-foreground/10',
        className,
      )}
      {...props}
    />
  );
}
