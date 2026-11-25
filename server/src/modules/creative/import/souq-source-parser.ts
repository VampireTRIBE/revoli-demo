import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { creativeBrands, souqSourceMappings } from '../config/creative-source.config.js';
import type {
  CreativeAccountDailyMetric,
  CreativeAccountMetricKey,
  CreativeAccountSourceAudit,
  CreativeAccountSummarySection,
  CreativeCoverageRecord,
  CreativePlatform,
} from '../types/creative.types.js';
import { decodeCsv, nullableNumber, parseCsv } from './csv-parser.js';

const metricLabels: Record<CreativeAccountMetricKey, string> = {
  views: 'Views',
  viewers: 'Viewers',
  reach: 'Reach',
  contentInteractions: 'Content interactions',
  follows: 'Follows',
  visits: 'Profile / page visits',
  linkClicks: 'Link clicks',
  followersTotal: 'Total followers',
};

export interface ParsedSouqSources {
  dailyMetrics: CreativeAccountDailyMetric[];
  summarySections: CreativeAccountSummarySection[];
  coverage: CreativeCoverageRecord[];
  audit: CreativeAccountSourceAudit;
}

export function parseSouqSources(directory: string): ParsedSouqSources {
  const dailyMetrics: CreativeAccountDailyMetric[] = [];
  const summarySections: CreativeAccountSummarySection[] = [];
  const coverage: CreativeCoverageRecord[] = [];
  const audit: CreativeAccountSourceAudit = { mappedFiles: [], flaggedFiles: [], malformedDailyRows: 0 };
  const mappedRelativePaths = new Set<string>();

  for (const mapping of souqSourceMappings) {
    const path = resolve(directory, ...mapping.file.split('/'));
    const sourceFile = relative(directory, path).replaceAll('\\', '/');
    mappedRelativePaths.add(sourceFile.toLowerCase());
    if (!existsSync(path)) {
      audit.flaggedFiles.push({ sourceFile, reason: 'Configured source file was not found.' });
      continue;
    }
    audit.mappedFiles.push({ sourceFile, brandId: mapping.brandId, platform: mapping.platform, identityRule: mapping.identityRule });
    const rows = parseCsv(decodeCsv(readFileSync(path)));
    const brand = creativeBrands.find((item) => item.id === mapping.brandId)?.label ?? mapping.brandId;
    if (mapping.kind === 'daily') {
      const parsed = parseDailyRows(rows, {
        brandId: mapping.brandId,
        brand,
        platform: mapping.platform,
        metric: mapping.metric,
        sourceFile,
      });
      dailyMetrics.push(...parsed.records);
      audit.malformedDailyRows += parsed.malformedRows;
      if (!parsed.records.length) audit.flaggedFiles.push({ sourceFile, reason: 'No valid dated metric rows were found.' });
      const dates = parsed.records.map((row) => row.date).sort();
      coverage.push({
        brandId: mapping.brandId,
        platform: mapping.platform,
        metric: metricLabels[mapping.metric],
        sourceFile,
        startDate: dates[0] ?? null,
        endDate: dates.at(-1) ?? null,
        rowCount: parsed.records.length,
        grain: 'daily-account',
      });
    } else {
      const sections = parseSummarySections(rows, mapping.brandId, brand, mapping.platform, sourceFile);
      summarySections.push(...sections);
      if (!sections.length) audit.flaggedFiles.push({ sourceFile, reason: 'No supported summary table block was found.' });
      coverage.push({
        brandId: mapping.brandId,
        platform: mapping.platform,
        metric: sections.map((section) => section.title).join('; ') || 'Account summary',
        sourceFile,
        startDate: null,
        endDate: null,
        rowCount: sections.reduce((total, section) => total + section.rows.length, 0),
        grain: 'summary',
      });
    }
  }

  const sourceFolder = resolve(directory, 'souqs', 'SOUQ Al Jubair and Bahar');
  if (existsSync(sourceFolder)) {
    for (const name of readdirSync(sourceFolder).filter((item) => item.toLowerCase().endsWith('.csv'))) {
      const sourceFile = relative(directory, resolve(sourceFolder, name)).replaceAll('\\', '/');
      if (!mappedRelativePaths.has(sourceFile.toLowerCase())) {
        audit.flaggedFiles.push({ sourceFile, reason: 'Source identity or platform is not configured; file was not imported.' });
      }
    }
  }

  const pocari = 'pocari-sweat/buffer-posts-analytics-csv/';
  const scope = 'Whole supplied export: 1 Jan to 1 Oct 2026; not a selected-month total. Source columns are reproduced as labelled; paid/organic attribution is not inferred.';
  for (const [file,title,fields] of [
    ['posts-summary-20260101-to-20261001.csv','Feed summary (source-reported)', ['Posts','Posts paid','Impressions','Reach','Likes','Comments']],
    ['stories-summary-20260101-to-20261001.csv','Stories summary (source-reported)', ['Stories','Impressions','Reach','Replies','Exits']],
  ] as const) {
    const sourceFile=pocari+file;
    const path=resolve(directory,sourceFile);
    if (!existsSync(path)) continue;
    const rows=parseCsv(decodeCsv(readFileSync(path)));
    const header=rows[0]??[], values=rows[1]??[];
    const summaryRows=fields.flatMap(label=>{const value=nullableNumber(values[header.indexOf(label)]);return value==null?[]:[{label,values:[value]}];});
    if (!summaryRows.length) continue;
    summarySections.push({brandId:'pocari-sweat',brand:'Pocari Sweat',platform:'instagram',title,columns:['Value'],rows:summaryRows,sourceFile,reportingScope:scope});
    audit.mappedFiles.push({sourceFile,brandId:'pocari-sweat',platform:'instagram',identityRule:'Same supplied Pocari Buffer export group as the identified paid posts.'});
    coverage.push({brandId:'pocari-sweat',platform:'instagram',metric:title,sourceFile,startDate:'2026-01-01',endDate:'2026-10-01',rowCount:summaryRows.length,grain:'summary'});
  }
  const followerFile=pocari+'metrics-insights-20260101-to-20261001.csv';
  const followerPath=resolve(directory,followerFile);
  if (existsSync(followerPath)) {
    const rows=parseCsv(decodeCsv(readFileSync(followerPath)));
    const column=(rows[0]??[]).indexOf('Total Followers');
    const followers:CreativeAccountDailyMetric[]=rows.slice(1).flatMap(row=>{
      const date=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(row[0]??'');
      const value=nullableNumber(row[column]);
      if(!date||value==null||value<0||!date[1]||!date[2]||!date[3])return [];
      const year=Number(date[3]),month=Number(date[1]),day=Number(date[2]);
      if(month<1||month>12||day<1||day>new Date(Date.UTC(year,month,0)).getUTCDate())return [];
      return [{brandId:'pocari-sweat',brand:'Pocari Sweat',platform:'instagram',metric:'followersTotal',metricLabel:'Total followers',date:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,year,month,value,sourceFile:followerFile}];
    });
    dailyMetrics.push(...followers);
    const dates=followers.map(row=>row.date).sort();
    coverage.push({brandId:'pocari-sweat',platform:'instagram',metric:'Total followers',sourceFile:followerFile,startDate:dates[0]??null,endDate:dates.at(-1)??null,rowCount:followers.length,grain:'daily-account'});
    audit.mappedFiles.push({sourceFile:followerFile,brandId:'pocari-sweat',platform:'instagram',identityRule:'Dated follower stock in supplied Pocari export; never summed.'});
  }
  return { dailyMetrics, summarySections, coverage, audit };
}

function parseDailyRows(
  rows: string[][],
  source: { brandId: string; brand: string; platform: CreativePlatform; metric: CreativeAccountMetricKey; sourceFile: string },
): { records: CreativeAccountDailyMetric[]; malformedRows: number } {
  const headerIndex = rows.findIndex((row) => row[0]?.trim().toLowerCase() === 'date');
  if (headerIndex < 0) return { records: [], malformedRows: Math.max(0, rows.length - 1) };
  let malformedRows = 0;
  const records = rows.slice(headerIndex + 1).flatMap((row) => {
    const date = row[0]?.slice(0, 10) ?? '';
    const value = nullableNumber(row[1]);
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(date) || value == null) {
      malformedRows += 1;
      return [];
    }
    const [year, month] = date.split('-').map(Number);
    return [{
      ...source,
      metricLabel: metricLabels[source.metric],
      date,
      year: year ?? 0,
      month: month ?? 0,
      value,
    }];
  });
  return { records, malformedRows };
}

function parseSummarySections(
  rows: string[][],
  brandId: string,
  brand: string,
  platform: CreativePlatform,
  sourceFile: string,
): CreativeAccountSummarySection[] {
  const blocks: Array<{ title: string; rows: string[][] }> = [];
  let current: { title: string; rows: string[][] } | null = null;
  for (const row of rows) {
    if (row.length === 1 && row[0]?.trim()) {
      if (current) blocks.push(current);
      current = { title: row[0].trim(), rows: [] };
    } else if (current) current.rows.push(row);
  }
  if (current) blocks.push(current);

  return blocks.flatMap((block) => {
    if (block.rows.length < 2) return [];
    const first = block.rows[0] ?? [];
    const isVerticalTable = !first[0]?.trim() || block.rows.length > 2;
    const columns = isVerticalTable ? first.slice(1).map((value) => value.trim()) : ['Value'];
    const tableRows = isVerticalTable
      ? block.rows.slice(1).map((row) => ({ label: row[0]?.trim() ?? '', values: columns.map((_, index) => nullableNumber(row[index + 1])) }))
      : first.map((label, index) => ({ label: label.trim(), values: [nullableNumber(block.rows[1]?.[index])] }));
    const validRows = tableRows.filter((row) => row.label && row.values.some((value) => value != null));
    if (!validRows.length) return [];
    return [{
      brandId,
      brand,
      platform,
      title: block.title,
      columns,
      rows: validRows,
      sourceFile,
      reportingScope: 'Whole supplied export; this file does not include a monthly breakdown or reporting date.',
    }];
  });
}
