import { useClientQuery } from '@trader-tavern/api-client';
import AltmanScoreCard from '@/pages/ticker/components/analysis/AltmanScoreCard';

type AnalysisTabProps = {
  ticker: string;
};

const AnalysisTab = ({ ticker }: AnalysisTabProps) => {
  const { data: altmanHistory, isPending } = useClientQuery(
    'get',
    '/finance/ticker/{id}/altman-history',
    { params: { path: { id: ticker } } },
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <AltmanScoreCard history={altmanHistory ?? null} isPending={isPending} />
    </div>
  );
};

export default AnalysisTab;
