// Standard Altman Z-Score zone thresholds (original 1968 model).
export const altmanZoneInfo = (
  score: number,
): { label: string; description: string; className: string } => {
  if (score > 2.99) {
    return {
      label: 'Safe Zone',
      description: 'Low probability of bankruptcy within the next two years.',
      className: 'text-emerald-600',
    };
  }
  if (score >= 1.81) {
    return {
      label: 'Grey Zone',
      description:
        'Some risk of financial distress; not clearly safe or at risk.',
      className: 'text-amber-600',
    };
  }
  return {
    label: 'Distress Zone',
    description: 'High probability of bankruptcy within the next two years.',
    className: 'text-red-600',
  };
};
