import { useFormatDate } from '@/hooks/useFormatDate';

type DateCellProps = {
  value: string | null;
};

const DateCell = ({ value }: DateCellProps) => {
  const { formatDate } = useFormatDate();
  return <>{formatDate(value)}</>;
};

export default DateCell;
