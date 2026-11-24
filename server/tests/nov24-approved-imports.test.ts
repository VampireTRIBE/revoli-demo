import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { getGa4V4 } from '../src/modules/media/services/media-supplements.service.js';
import { parseCompetitionCaptureV2 } from '../src/modules/competition/import/capture-v2-parser.js';
import { competitionConfigs } from '../src/modules/competition/config/competition.config.js';
import { firstObserved, noLongerObserved } from '../src/modules/competition/calculations/competition-calculations.js';

const root = path.resolve(process.cwd().endsWith('/server') ? '..' : '.');
const file=(name:string)=>path.join(root,'spreadsheets data','competition','union-coop',name);
const carrefour=competitionConfigs.find((config)=>config.id==='carrefour-uae');
const lulu=competitionConfigs.find((config)=>config.id==='lulu-hypermarket');
if(!carrefour||!lulu)throw new Error('Competition configuration missing');

describe('Actual 24 Nov imported source workbooks',()=>{
  it('loads GA4 Sep and Oct with signed refund revenue and reconciled net totals',()=>{
    const data=getGa4V4(2026);
    expect(data.available,data.reason??'GA4 workbook unavailable').toBe(true);
    for(const [month,expectedNet,expectedFtp,refunds] of [[9,1863332,1060,-202434],[10,3026634,1712,-237851]] as const){
      const summary=data.summaries.find((row)=>row.month===month);
      const rows=data.channels.filter((row)=>row.month===month);
      expect(summary?.netRevenueAed).toBe(expectedNet);
      expect(summary?.firstTimePurchasers).toBe(expectedFtp);
      expect(rows).toHaveLength(17);
      expect(rows.find((row)=>row.channel==='Unassigned')?.revenueAed).toBe(refunds);
      // Source workbook's channel sums are AED 1 above its monthly summaries.
      expect(Math.abs(rows.reduce((sum,row)=>sum+(row.revenueAed??0),0)-expectedNet)).toBeLessThanOrEqual(1);
    }
  });
  it('retains Oct and Nov Union Coop capture rows, with non-readable IDs excluded from deltas',()=>{
    const baseline='Competition-Capture-UnionCoop-Carrefour-LuLu-01-Oct-2026.xlsx';
    const november='Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx';
    const [cOct]=parseCompetitionCaptureV2(file(baseline),carrefour);
    const [lOct]=parseCompetitionCaptureV2(file(baseline),lulu);
    const [cNov]=parseCompetitionCaptureV2(file(november),carrefour);
    const [lNov]=parseCompetitionCaptureV2(file(november),lulu);
    if(!cOct||!lOct||!cNov||!lNov)throw new Error('Expected all four historical captures');
    expect([cOct.observations.length,lOct.observations.length]).toEqual([30,24]);
    expect([cNov.observations.length,lNov.observations.length]).toEqual([57,54]);
    expect(cNov.observations.filter((ad)=>ad.libraryIdAvailable===false)).toHaveLength(1);
    expect(lNov.observations.filter((ad)=>ad.libraryIdAvailable===false)).toHaveLength(15);
    expect([cNov.launchesSincePreviousCapture,lNov.launchesSincePreviousCapture]).toEqual([56,39]);
    expect(cNov.importedThemeMix?.[0]?.label).toBe('Supplier brand');
    expect(lNov.importedThemeMix?.[0]?.label).toBe('LuLu Savers');
    expect(cNov.highlights).toEqual([]); // Drafts are NOT approved.
    expect(lNov.highlights).toEqual([]);
    expect(firstObserved(cNov,[cOct])).toHaveLength(56);
    expect(firstObserved(lNov,[lOct])).toHaveLength(39);
    expect(noLongerObserved(cNov,cOct)).toHaveLength(29);
  });
});
