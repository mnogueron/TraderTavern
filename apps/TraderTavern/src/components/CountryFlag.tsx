import Flag from 'react-flagpack';
import { getCountryFlagCode } from '@/lib/countryFlags';

type CountryFlagProps = {
  country: string | null | undefined;
  size?: 's' | 'm' | 'l';
  className?: string;
};

const CountryFlag = ({ country, size = 's', className }: CountryFlagProps) => {
  const code = getCountryFlagCode(country);
  if (!code) {
    return null;
  }

  return (
    <Flag
      code={code}
      size={size}
      hasBorder={false}
      hasDropShadow={false}
      className={`shrink-0 ${className ?? ''}`}
    />
  );
};

export default CountryFlag;
