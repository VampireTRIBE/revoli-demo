import { describe, expect, it } from 'vitest';
import { formatAED, formatCampaignName, formatNumber, formatPercent, formatRatio } from './formatters';

describe('Media formatters', () => {
  it('renders missing numeric values as N/A', () => {
    expect(formatAED(null)).toBe('N/A');
    expect(formatNumber(undefined)).toBe('N/A');
    expect(formatPercent(null)).toBe('N/A');
    expect(formatRatio(undefined)).toBe('N/A');
  });

  it('formats supported display types without changing the input value', () => {
    expect(formatNumber(12_720)).toBe('12,720');
    expect(formatPercent(1.054, 1)).toBe('105.4%');
    expect(formatRatio(9.04)).toBe('9.04x');
    expect(formatAED(1_730_000, true)).toContain('1.7M');
  });

  it('renders source campaign identifiers as readable full names', () => {
    expect(formatCampaignName("TTN_PMAX_OMEGA_SPEEDMASTER_JULY'26-SEP26_SWISS_EXTRA"))
      .toBe("TTN PMAX OMEGA SPEEDMASTER JULY'26-SEP26 SWISS EXTRA");
  });
});
