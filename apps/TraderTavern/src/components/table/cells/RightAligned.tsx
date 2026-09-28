import type { ReactNode } from 'react';

type RightAlignedProps = {
  children: ReactNode;
};

const RightAligned = ({ children }: RightAlignedProps) => (
  <div className="text-right tabular-nums">{children}</div>
);

export default RightAligned;
