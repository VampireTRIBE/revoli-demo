export function decodeCsv(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  const offset = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf ? 3 : 0;
  return buffer.subarray(offset).toString('utf8');
}

export function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^sep=,\s*(?:\r?\n)/i, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (quoted) {
      if (character === '"' && normalized[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ''));
}

export function tableRecords(rows: string[][], headerIndex = 0): Array<Record<string, string>> {
  const headers = uniqueHeaders(rows[headerIndex] ?? []);
  return rows.slice(headerIndex + 1)
    .filter((row) => row.some((value) => value.trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

function uniqueHeaders(headers: string[]): string[] {
  const counts = new Map<string, number>();
  return headers.map((header, index) => {
    const base = header.trim() || `column_${index + 1}`;
    const count = (counts.get(base.toLowerCase()) ?? 0) + 1;
    counts.set(base.toLowerCase(), count);
    return count === 1 ? base : `${base}__${count}`;
  });
}

export function nullableNumber(value: string | undefined): number | null {
  if (value == null || value.trim() === '' || /^(-|n\/?a)$/i.test(value.trim())) return null;
  const parsed = Number(value.replace(/,/g, '').replace(/%$/, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function repairMojibake(value: string | undefined): string | null {
  if (!value) return null;
  if (!/[ÃÂØÙ]/.test(value)) return value;
  const repaired = Buffer.from(value, 'latin1').toString('utf8');
  return repaired.includes('\uFFFD') ? value : repaired;
}
