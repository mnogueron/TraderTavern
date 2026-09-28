import { Section, SectionContent } from '@/components/Section';
import { Skeleton } from '@/components/ui/skeleton';
import type { Fundamental } from '@/pages/ticker/components/financials/types';
import MarginBar from '@/pages/ticker/components/financials/MarginBar';

type MarginsCardProps = {
  fundamental: Fundamental | null;
  isPending: boolean;
};

const MARGIN_DEFINITIONS: {
  label: string;
  key: 'operatingMargin' | 'profitMargin' | 'fcfMargin';
}[] = [
  { label: 'Operating Margin', key: 'operatingMargin' },
  { label: 'Profit Margin', key: 'profitMargin' },
  { label: 'FCF Margin', key: 'fcfMargin' },
];

const MarginsCard = ({ fundamental, isPending }: MarginsCardProps) => {
  return (
    <Section title="Margins">
      <SectionContent className="flex flex-col gap-3">
        {isPending || !fundamental
          ? MARGIN_DEFINITIONS.map((margin) => (
              <Skeleton key={margin.label} className="h-9" />
            ))
          : MARGIN_DEFINITIONS.map((margin) => (
              <MarginBar
                key={margin.label}
                label={margin.label}
                value={fundamental[margin.key]}
              />
            ))}
      </SectionContent>
    </Section>
  );
};

export default MarginsCard;
