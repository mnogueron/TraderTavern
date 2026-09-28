import { cn } from '@/lib/utils';

type LogoProps = {
  large?: boolean;
};

const Logo = ({ large }: LogoProps) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:text-xs',
      large ? 'size-9 text-base' : 'size-8 text-sm',
    )}
  >
    TT
  </div>
);

export default Logo;
