import type { ReactNode } from 'react';

type StatGroupProps = {
  title: string;
  children: ReactNode;
};

const StatGroup = ({ title, children }: StatGroupProps) => (
  <div className="break-inside-avoid-column">
    <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {title}
    </h3>
    <div className="flex flex-col text-sm">{children}</div>
  </div>
);

export default StatGroup;
