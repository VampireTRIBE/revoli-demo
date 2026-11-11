import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { getCleoSnapshot, listCleoSnapshots, parseCleoWorkbook, resolveCleoDirectory } from '../src/modules/creative/cleo/cleo-import.js';

const source = () => resolve(resolveCleoDirectory(), 'UnionCoop-CLEO-Market-Import.xlsx');

describe('CLEO approved spreadsheet import', () => {
  it('loads all six data sheets and the unscored 2 November capture', () => {
    const data = parseCleoWorkbook(source());
    expect(data.captureDate).toBe('2026-11-02');
    expect(data.unscored).toBe(true);
    expect(data.source).toBe('Source: CLEO - single-source, not independently verifiable.');
    expect(data.allTopics).toMatchObject({ answers: 815, shares: { unionCoop: 3, carrefour: 47, lulu: 38 } });
    expect(data.questions).toHaveLength(12);
    expect(data.positions).toHaveLength(6);
    expect(data.funnel).toHaveLength(4);
    expect(data.domains).toHaveLength(6);
    expect(data.language).toHaveLength(11);
    expect(data.windowLabels).toEqual({ topics: '28 days', questions: '30 days', positions: '30 days', funnel: 'Latest week', domains: '90 days', language: '7 days' });
  });
  it('keeps cited appearances separate from wins and missing positions separate from zeros', () => {
    const data = getCleoSnapshot();
    expect(data).not.toBeNull();
    expect(data?.questions.filter((row) => row.unionCoopCitations > 0)).toHaveLength(3);
    expect(data?.questions.filter((row) => row.result.toLowerCase() === 'win')).toHaveLength(0);
    expect(data?.questionSummary.toLowerCase()).toContain('0% win rate');
    expect(data?.positions.find((row) => row.brand === 'Nesto Hypermarket')?.googleAio).toBeNull();
    expect(data?.topics.find((row) => row.topic === 'Online grocery delivery')?.otherDisplay).toBe('<1%');
  });
  it('supports capture lookup and rejects unavailable capture dates', () => {
    expect(listCleoSnapshots()).toHaveLength(1);
    expect(getCleoSnapshot('2026-11-02')?.availableCaptures).toEqual(['2026-11-02']);
    expect(getCleoSnapshot('2026-10-02')).toBeNull();
  });
});
