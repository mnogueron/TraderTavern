import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500];

type PageSizeSelectorProps = {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
};

export function PageSizeSelector({
  value,
  onChange,
  options = PAGE_SIZE_OPTIONS,
}: PageSizeSelectorProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => next && onChange(Number(next))}
    >
      <SelectTrigger aria-label="Page size" size="sm">
        <SelectValue placeholder="Page size" />
      </SelectTrigger>
      <SelectContent>
        {options.map((size) => (
          <SelectItem key={size} value={String(size)}>
            {size} / page
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
