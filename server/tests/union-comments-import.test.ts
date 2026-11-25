import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getUnionCoopCommentTypes } from '../src/modules/consumer/services/union-comments.service.js';

const originalCwd = process.cwd();
const folders: string[] = [];
afterEach(() => {
  process.chdir(originalCwd);
  folders.forEach((folder) => rmSync(folder, {recursive: true, force: true}));
  folders.length = 0;
});
function stage(content: string) {
  const root = mkdtempSync(join(tmpdir(), 'bizcom-comment-import-'));
  folders.push(root);
  const dir = join(root, 'spreadsheets data', 'consumer', 'union-coop');
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, 'UnionCoop-Comment-Types-Import.csv'), content);
  process.chdir(root);
}

describe('Union Coop comment-type import', () => {
  it('does not invent missing data', () => {
    const result = getUnionCoopCommentTypes(2026, 10);
    expect(result.available).toBe(false);
    expect(result.categories).toHaveLength(0);
  });
  it('imports all four approved categories by selected month', () => {
    stage('Month,Category,Count\n2026-10,Contest entries,23\n2026-10,Product questions,8\n2026-10,Complaints,3\n2026-10,Praise,7\n2026-09,Praise,90\n');
    const result = getUnionCoopCommentTypes(2026, 10);
    expect(result.available).toBe(true);
    expect(result.total).toBe(41);
    expect(result.categories).toHaveLength(4);
  });
  it('rejects incomplete imports rather than converting missing counts to zero', () => {
    stage('Month,Category,Count\n2026-10,Contest entries,23\n2026-10,Product questions,8\n2026-10,Complaints,3\n');
    const result = getUnionCoopCommentTypes(2026, 10);
    expect(result.available).toBe(false);
    expect(result.categories).toHaveLength(0);
  });
});
