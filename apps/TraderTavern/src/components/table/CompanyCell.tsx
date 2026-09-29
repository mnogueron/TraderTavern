import { Link } from 'react-router';
import CompanyLogo from '@/components/CompanyLogo';
import { cn } from '@/lib/utils';

type CompanyCellProps = {
  ticker: string | null;
  companyName: string | null;
  logoUrl?: string | null;
  className?: string;
};

const CompanyCell = ({
  ticker,
  companyName,
  logoUrl,
  className,
}: CompanyCellProps) => {
  const label = companyName ?? ticker ?? '—';

  const content = (
    <div
      className={cn('flex min-w-0 max-w-64 items-center gap-2', className)}
    >
      <CompanyLogo size="sm" logoUrl={logoUrl} companyName={label} />
      <span className="truncate">{label}</span>
    </div>
  );

  if (!ticker) {
    return content;
  }

  return (
    <Link to={`/ticker/${ticker}`} className="hover:underline">
      {content}
    </Link>
  );
};

export default CompanyCell;
