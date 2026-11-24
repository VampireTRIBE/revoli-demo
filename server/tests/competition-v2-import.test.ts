import { afterEach, describe, expect, it } from 'vitest';
import XLSX from 'xlsx';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseCompetitionCaptureV2 } from '../src/modules/competition/import/capture-v2-parser.js';
import { competitionConfigs } from '../src/modules/competition/config/competition.config.js';

let dir: string | null = null;
afterEach(()=>{if(dir)rmSync(dir,{recursive:true,force:true});dir=null;});
const create = (name:string,sheets:Record<string,Record<string,string>[]>)=>{
  dir=mkdtempSync(path.join(tmpdir(),'bizcom-competition-v2-'));
  const book=XLSX.utils.book_new();
  for(const [title,rows] of Object.entries(sheets))XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet(rows),title);
  const file=path.join(dir,name);XLSX.writeFile(book,file);return file;
};
const edit=competitionConfigs.find((c)=>c.id==='edit-by-ahmed-seddiqi')!;
const carrefour=competitionConfigs.find((c)=>c.id==='carrefour-uae')!;
const lulu=competitionConfigs.find((c)=>c.id==='lulu-hypermarket')!;

describe('Competition V2 import contract',()=>{
  it('retains Google reported population distinct from sampled rows and does not invent Library IDs',()=>{
    const file=create('EDIT-Google-Capture1-18Nov2026.xlsx',{
      'Read Me':[{Notes:'Google reports ~200 ads; 30 logged creatives in sample'}],
      'EDIT Register':[
        {'Capture date':'2026-11-18',Channel:'Google',Format:'Search RSA',Status:'Active',Platforms:'Search','Library ID':'(not captured)'},
        {'Capture date':'2026-11-18',Channel:'Google',Format:'Display',Status:'Removed',Platforms:'Display','Library ID':'(not captured)'},
      ],
    });
    const [capture]=parseCompetitionCaptureV2(file,edit);
    if(!capture)throw new Error('Expected the Google sample capture');
    expect(capture.observations).toHaveLength(2);
    expect(capture.reportedPopulation).toBe(200);
    expect(capture.sampleSize).toBe(2);
    expect(capture.channel).toBe('Google');
    const firstObservation=capture.observations[0];
    if(!firstObservation)throw new Error('Expected at least one Google observation');
    expect(firstObservation.libraryId).toMatch(/^not-captured-/);
    expect(firstObservation.startDateAvailable).toBe(false);
  });
  it('keeps separate competitor sheets and only publishes explicitly signed highlights',()=>{
    const file=create('Competition-Capture-UnionCoop-Carrefour-LuLu-18-Nov-2026.xlsx',{
      'Carrefour Register':[{'Capture date':'2026-11-18',Competitor:'Carrefour UAE',Channel:'Meta','Library ID':'1234567890','Start date':'2026-11-17',Status:'Active',Format:'Carousel'}],
      'LuLu Register':[{'Capture date':'2026-11-18',Competitor:'LuLu Hypermarket',Channel:'Meta','Library ID':'0123456789','Start date':'2026-11-10',Status:'Active',Format:'Static'}],
      'Draft Highlights':[
        {Brand:'Carrefour UAE',Sentence:'Signed analyst statement',Signed:'yes'},
        {Brand:'Carrefour UAE',Sentence:'Unapproved speculation',Signed:'no'},
      ],
    });
    const [cc]=parseCompetitionCaptureV2(file,carrefour);
    const [lc]=parseCompetitionCaptureV2(file,lulu);
    if(!cc||!lc)throw new Error('Expected both Carrefour and LuLu captures');
    expect(cc.observations).toHaveLength(1);
    expect(lc.observations).toHaveLength(1);
    expect(cc.highlights).toEqual(['Signed analyst statement']);
    expect(lc.highlights).toEqual([]);
    expect(cc.captureDate).toBe('2026-11-18');
  });
});
