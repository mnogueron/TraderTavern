import { useParams } from 'react-router';
import WatchlistDetailPage from '@/pages/watchlist/WatchlistDetailPage';

export default function WatchlistRoute() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <WatchlistDetailPage watchlistId={id} />;
}
