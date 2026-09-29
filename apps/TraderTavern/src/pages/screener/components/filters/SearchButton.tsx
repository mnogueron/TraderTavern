import type { ComponentProps } from 'react';
import { RiSearchLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SearchButtonProps = ComponentProps<typeof Button> & {
  label: string;
};

const SearchButton = ({ label, className, ...props }: SearchButtonProps) => (
  <Button
    variant="outline"
    size="xs"
    className={cn(
      'h-6 w-44 justify-start gap-1.5 font-normal text-muted-foreground cursor-pointer',
      className,
    )}
    {...props}
  >
    <RiSearchLine className="size-3.5 shrink-0" />
    <span className="truncate text-xs">{label}</span>
  </Button>
);

export default SearchButton;
