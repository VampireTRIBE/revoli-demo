import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { parseCompetitionCaptureV2 } from '../src/modules/competition/import/capture-v2-parser.js';
import { competitionConfigs } from '../src/modules/competition/config/competition.config.js';
import { activeObservations } from '../src/modules/competition/calculations/competition-calculations.js';
import { getCompetitionDashboard, clearCompetitionSourceCache } from '../src/modules/competition/services/competition.service.js';

const source = [
  path.resolve(process.cwd(), '../spreadsheets data/compititaion-tab/EDIT-Google-Capture1-18Nov2026.xlsx'),
  path.resolve(process.cwd(), 'spreadsheets data/compititaion-tab/EDIT-Google-Capture1-18Nov2026.xlsx'),
].find(existsSync);
const config = competitionConfigs.find((row) => row.id === 'edit-by-ahmed-seddiqi');

describe('real EDIT Google Transparency Center capture', () => {
  it('preserves the reported population separate from the logged sample', () => {
    expect(source).toBeDefined();
    expect(config).toBeDefined();
    const captures = parseCompetitionCaptureV2(source!, config!);
    expect(captures).toHaveLength(1);
    const capture = captures[0]!;
    expect(capture.channel).toBe('Google');
    expect(capture.captureDate).toBe('2026-11-18');
    expect(capture.reportedPopulation).toBe(200);
    expect(capture.sampleSize).toBe(30);
    expect(capture.observations).toHaveLength(30);
    expect(activeObservations(capture)).toHaveLength(30);
    expect(new Set(capture.observations.map((row)=>row.libraryId)).size).toBe(30);
    expect(capture.observations.every((row)=>row.startDateAvailable === false)).toBe(true);
    expect(capture.observations.every((row)=>row.payerVerified)).toBe(true);
    expect(capture.highlights).toEqual([]); // Draft Highlights have no signed flag.
    const formats = capture.observations.reduce<Record<string,number>>((counts,row)=>{
      counts[row.formatGroup] = (counts[row.formatGroup] ?? 0) + 1;
      return counts;
    }, {});
    expect(formats).toEqual({ Search:11, 'Local/Maps':5, Shopping:7, Display:7 });
  });
  it('API output keeps Google sample and Meta captures separate', () => {
    clearCompetitionSourceCache();
    const google = getCompetitionDashboard({ competitor:'edit-by-ahmed-seddiqi',channel:'Google',captureDate:'2026-11-18' });
    expect(google.available).toBe(true);
    expect(google.channel).toBe('Google');
    expect(google.activity.activeAds).toBe(30); // Logged records, not census. UI labels as sample.
    expect(google.sample).toEqual({logged:30,reported:200,sampleOnly:true});
    expect(google.activity.averageDaysRunning).toBeNull();
    expect(google.launches.startedInSelectedMonth).toBeNull();
    expect(google.gallery).toHaveLength(0);
    const meta = getCompetitionDashboard({competitor:'edit-by-ahmed-seddiqi',channel:'Meta',captureDate:'2026-11-03'});
    expect(meta.available).toBe(true);
    expect(meta.channel).toBe('Meta');
    expect(meta.activity.activeAds).toBe(68);
    expect(meta.gallery).toHaveLength(15);
  });
});
