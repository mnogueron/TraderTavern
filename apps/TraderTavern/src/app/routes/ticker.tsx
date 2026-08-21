import { useParams } from 'react-router';
import TickerDetailPage from '@/pages/ticker/TickerDetailPage';

export default function TickerRoute() {
  const { ticker } = useParams<{ ticker: string }>();

  if (!ticker) {
    return null;
  }

  return <TickerDetailPage ticker={ticker} />;
}
