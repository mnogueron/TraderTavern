import { intervalToDuration } from 'date-fns';

export const changePercentClassName = (value: number | null) => {
  if (value === null || value === 0) {
    return 'text-muted-foreground';
  }
  return value > 0 ? 'text-emerald-600' : 'text-red-600';
};

export const formatDuration = (ms: number) => {
  const duration = intervalToDuration({ start: 0, end: Math.max(0, ms) });
  const hours = (duration.days ?? 0) * 24 + (duration.hours ?? 0);
  const minutes = duration.minutes ?? 0;
  const seconds = duration.seconds ?? 0;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};
