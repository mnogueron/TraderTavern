import { Link } from 'react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar size="sm" className="rounded-md after:rounded-md">
        {logoUrl ? <AvatarImage src={logoUrl} alt="" /> : null}
        <AvatarFallback className="rounded-md">
          {label.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
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
