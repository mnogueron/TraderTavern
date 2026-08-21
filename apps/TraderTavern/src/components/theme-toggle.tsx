import { RiMoonLine, RiSunLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={toggleTheme}
    >
      {theme === 'dark' ? <RiSunLine /> : <RiMoonLine />}
    </Button>
  );
};
