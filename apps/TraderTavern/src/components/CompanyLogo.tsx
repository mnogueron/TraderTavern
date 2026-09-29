import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type CompanyLogoProps = {
  logoUrl?: string | null;
  companyName: string;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
};

const CompanyLogo = ({
  logoUrl,
  companyName,
  size = 'default',
  className,
}: CompanyLogoProps) => {
  return (
    <Avatar
      size={size}
      className={cn('rounded-full bg-white after:hidden', className)}
    >
      {logoUrl ? <AvatarImage src={logoUrl} alt="" /> : null}
      <AvatarFallback className="rounded-md">
        {companyName.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default CompanyLogo;
