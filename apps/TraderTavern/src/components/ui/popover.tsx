import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import { cn } from '@/lib/utils';
import { Command, CommandInput, CommandList } from '@/components/ui/command';

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-header"
      className={cn('flex flex-col gap-0.5 text-sm', className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn('font-medium', className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  );
}

function PopoverFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-footer"
      className={cn('flex items-center justify-between gap-2', className)}
      {...props}
    />
  );
}

function PopoverNoResult({
  className,
  children = 'No results found.',
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-no-result"
      className={cn(
        'flex items-center justify-center py-6 px-2 text-xs text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function PopoverError({
  className,
  children = 'Something went wrong.',
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-error"
      className={cn(
        'flex items-center justify-center py-6 px-2 text-xs text-destructive',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function PopoverCommandInput({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<typeof CommandInput>) {
  return (
    <CommandInput
      className={cn('text-xs', className)}
      wrapperClassName={cn('p-1', wrapperClassName)}
      {...props}
    />
  );
}

function PopoverCommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandList>) {
  return <CommandList className={cn('p-1', className)} {...props} />;
}

function PopoverCommand({
  className,
  align,
  alignOffset,
  side,
  sideOffset,
  shouldFilter,
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent> &
  Pick<React.ComponentProps<typeof Command>, 'shouldFilter'>) {
  return (
    <PopoverContent
      className={cn('p-0', className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    >
      <Command shouldFilter={shouldFilter}>{children}</Command>
    </PopoverContent>
  );
}

Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;
Popover.Command = PopoverCommand;
Popover.CommandInput = PopoverCommandInput;
Popover.CommandList = PopoverCommandList;
Popover.Header = PopoverHeader;
Popover.Title = PopoverTitle;
Popover.Description = PopoverDescription;
Popover.Footer = PopoverFooter;
Popover.NoResult = PopoverNoResult;
Popover.Error = PopoverError;

export {
  Popover,
  PopoverCommand,
  PopoverContent,
  PopoverDescription,
  PopoverError,
  PopoverFooter,
  PopoverHeader,
  PopoverNoResult,
  PopoverTitle,
  PopoverTrigger,
  PopoverCommandInput,
  PopoverCommandList,
};
