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
// styles/global.css), which lightweight-charts can't consume directly: its
// color parser only understands hex/rgb(a)/hsl(a), and modern browsers'
// getComputedStyle() now echoes back the color in its originally-authored
// color space (oklch) rather than normalizing to rgb(). Painting the
// resolved color onto a 1x1 canvas and reading the pixel back forces a
// conversion to concrete sRGB, since canvas always renders in that space
// regardless of the input color space.
const resolveColor = (variable: string): string => {
  const probe = document.createElement('div');
  probe.style.color = `var(${variable})`;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return computed;
  }
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a / 255})`;
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
