import type { ComponentProps, ReactNode } from 'react';
import { CardSurface } from '@/components/CardSurface';
import { cn } from '@/lib/utils';

type SectionProps = {
  title: ReactNode;
  description?: ReactNode;
  actionElement?: ReactNode;
  children: ReactNode;
} & Omit<ComponentProps<typeof CardSurface>, 'title'>;

export function Section({
  title,
  description,
  actionElement,
  children,
  className,
  ...props
}: SectionProps) {
  return (
    <CardSurface className={cn('flex flex-col', className)} {...props}>
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {actionElement && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            {actionElement}
          </div>
        )}
      </div>
      {children}
    </CardSurface>
  );
}

export function SectionContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="section-content" className={cn('border-t p-4', className)} {...props} />
  );
}

export function SectionFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="section-footer" className={cn('border-t p-4', className)} {...props} />
  );
}
