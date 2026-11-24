/** Verify the relocated source files without changing their content or requiring npm dependencies. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'spreadsheets data');
const manifest = require('../docs/SPREADSHEET_SOURCE_MANIFEST.json');
const overrides = require('../docs/APPROVED_24NOV_SOURCE_OVERRIDES.json');
const categories = new Set(['media', 'creative', 'consumer', 'competition', 'search', 'highlights']);
const data = manifest.filter(item => item.kind === '.xlsx' || item.kind === '.csv');
assert.equal(data.filter(x => x.kind === '.xlsx').length, 19);
assert.equal(data.filter(x => x.kind === '.csv').length, 61);
assert.equal(data.length, 80);
for (const item of manifest) {
  assert.ok(item.new.startsWith('docs/') || categories.has(item.new.split('/')[0]), `Invalid category ${item.new}`);
  const destination = item.new.startsWith('docs/') ? path.join(root, item.new) : path.join(base, item.new);
  assert.ok(fs.existsSync(destination), `Missing source: ${destination}`);
  const bytes = fs.readFileSync(destination);
  const expected = overrides[item.new] ?? item;
  assert.equal(bytes.length, expected.bytes, `Size mismatch: ${item.new}`);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected.sha256, `Checksum mismatch: ${item.new}`);
  assert.ok(!fs.existsSync(path.join(base, item.old)), `Old file was not relocated: ${item.old}`);
}
for (const legacy of ['creative-tab', 'consumer-tab', 'media-tab', 'compititaion-tab']) {
  assert.ok(!fs.existsSync(path.join(base, legacy)), `Legacy category still exists: ${legacy}`);
}
for (const required of [
  'media/rivoli/Rivoli-Meta-Brand-Spend-Jan-Sep-2026.xlsx',
  'creative/union-coop/UnionCoop-Creative-WhyItWorked-Import.xlsx',
  'creative/union-coop/Buffer insights Union Coop/UC buffer Instagram/posts.csv',
  'creative/pocari-sweat/buffer-posts-analytics-csv/posts-20260101-to-20261001.csv',
  'creative/souqs/SOUQ Al Jubair and Bahar/SAB.csv',
  'consumer/rivoli/Rivoli-Consumer-Import.xlsx',
  'competition/rivoli/EDIT-Google-Capture1-18Nov2026.xlsx',
  'search/union-coop/UnionCoop-CLEO-Market-Import.xlsx',
  'highlights/tbl/TBL-Reads-Import.xlsx',
]) {
  assert.ok(fs.existsSync(path.join(base, required)), `Expected live source missing: ${required}`);
}
console.log(`PASS ${data.length} original spreadsheet/CSV mappings (79 unchanged, ${Object.keys(overrides).length} intentionally replaced by the new approved import), 6 categories`);
console.log('PASS Original SHA-256 checksums for unchanged sources and approved override checksums');
