import { useEffect, useState } from 'react';

export type ChartColors = {
  background: string;
  text: string;
  mutedText: string;
  grid: string;
  border: string;
};

// Fallbacks matching the light theme in styles/global.css, used until the
// client-only resolution below runs (and during SSR, where `document` and
// therefore computed styles aren't available).
const FALLBACK_COLORS: ChartColors = {
  background: '#ffffff',
  text: '#171717',
  mutedText: '#737373',
  grid: '#ebebeb',
  border: '#ebebeb',
};

// Design tokens are authored as oklch() CSS custom properties (see
// styles/global.css), which lightweight-charts can't consume directly since
// canvas needs a concrete color. Assigning the variable to a probe element
// and reading its computed `color` back resolves it to an rgb()/rgba()
// string regardless of the authored color space.
const resolveColor = (variable: string): string => {
  const probe = document.createElement('div');
  probe.style.color = `var(${variable})`;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return resolved;
};

const readColors = (): ChartColors => ({
  background: resolveColor('--card'),
  text: resolveColor('--card-foreground'),
  mutedText: resolveColor('--muted-foreground'),
  grid: resolveColor('--border'),
  border: resolveColor('--border'),
});

// Tracks the app's light/dark theme (toggled via a `dark` class on
// <html>, see components/theme-provider.tsx) and re-resolves the chart's
// CSS-variable-backed colors whenever it changes.
export const useChartColors = (): ChartColors => {
  const [colors, setColors] = useState<ChartColors>(FALLBACK_COLORS);

  useEffect(() => {
    setColors(readColors());

    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
};
