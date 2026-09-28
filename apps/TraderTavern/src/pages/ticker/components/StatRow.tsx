import type { ReactNode } from 'react';

type StatRowProps = {
  label: string;
  value: ReactNode;
  valueClassName?: string;
};

const StatRow = ({ label, value, valueClassName }: StatRowProps) => (
  <div className="-mx-1.5 grid grid-cols-2 gap-y-1.5 rounded-md border-b border-dotted border-border/70 px-1.5 py-0.5 transition-colors hover:bg-muted/60">
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-right tabular-nums ${valueClassName ?? ''}`}>
      {value}
    </span>
  </div>
);

export default StatRow;
