type StringCellProps = {
  value: string | null;
};

const StringCell = ({ value }: StringCellProps) => <>{value ?? '—'}</>;

export default StringCell;
