import { formatDate } from '@/lib/format';

type DateCellProps = {
  value: string | null;
};

const DateCell = ({ value }: DateCellProps) => <>{formatDate(value)}</>;

export default DateCell;
