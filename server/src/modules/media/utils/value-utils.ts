export type SheetRow = Record<string, unknown>;

export function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

export function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || text(value) === '') return null;
  const parsed = numberValue(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function value(row: SheetRow, ...names: string[]): unknown {
  for (const name of names) {
    if (name in row) return row[name];
  }
  const normalized = Object.entries(row).map(([key, entry]) => [normalize(key), entry] as const);
  for (const name of names) {
    const target = normalize(name);
    const found = normalized.find(([key]) => key === target);
    if (found) return found[1];
  }
  return undefined;
}

function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
