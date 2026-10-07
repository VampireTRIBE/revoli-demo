export const formatAED = (value: number | null | undefined, compact = false) => value === null || value === undefined
  ? 'N/A'
  : new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: compact ? 1 : 0, notation: compact ? 'compact' : 'standard' }).format(value);

export const formatNumber = (value: number | null | undefined, digits = 0) => value === null || value === undefined
  ? 'N/A'
  : new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);

export const formatPercent = (value: number | null | undefined, digits = 1) => value === null || value === undefined
  ? 'N/A'
  : new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

export const formatRatio = (value: number | null | undefined) => value === null || value === undefined ? 'N/A' : `${value.toFixed(2)}x`;

export const formatCampaignName = (value: string) => value
  .replace(/_+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
