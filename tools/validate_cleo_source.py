"""Dependency-free acceptance check for the supplied CLEO workbook's source rows.

Run: python tools/validate_cleo_source.py
This checks raw XLSX XML. The application uses the TypeScript SheetJS parser.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'spreadsheets data' / 'creative-tab' / 'UnionCoop-CLEO-Market-Import.xlsx'
MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def table_rows(archive: ZipFile, member: str, shared_strings: list[str]) -> list[list[str]]:
    root = ET.fromstring(archive.read(member))
    rows: list[list[str]] = []
    for row in root.findall(f'.//{MAIN}sheetData/{MAIN}row'):
        cols = []
        for cell in row.findall(f'{MAIN}c'):
            item = cell.find(f'{MAIN}v')
            inline = cell.find(f'{MAIN}is')
            value = item.text if item is not None else ''.join(inline.itertext()) if inline is not None else ''
            if cell.get('t') == 's' and value:
                value = shared_strings[int(value)]
            col_letters = re.match(r'([A-Z]+)', cell.get('r', ''))
            if col_letters:
                index = 0
                for character in col_letters.group(1):
                    index = index * 26 + ord(character) - 64
                while len(cols) < index:
                    cols.append('')
                cols[index - 1] = value or ''
        rows.append(cols)
    return rows


def main() -> None:
    with ZipFile(FILE) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared = [''.join(node.itertext()) for node in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        book = ET.fromstring(archive.read('xl/workbook.xml'))
        rels = {node.get('Id'): node.get('Target') for node in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        for sheet in book.find(f'{MAIN}sheets'):
            relative = rels[sheet.get(f'{REL}id')].lstrip('/')
            member = relative if relative.startswith('xl/') else f'xl/{relative}'
            sheets[sheet.get('name')] = table_rows(archive, member, shared)

    expected = {'README - Display Rules', 'Market Questions', 'Share of Voice by Topic', 'Position by Engine', 'Visibility Funnel', 'Citation Domains', 'Language of the Market'}
    assert set(sheets) == expected, set(sheets) ^ expected
    content_rows = {name: [r for r in rows[1:] if r and len(r) > 1 and r[1].strip()] for name, rows in sheets.items() if name != 'README - Display Rules'}
    assert len(content_rows['Market Questions']) == 12
    assert len(content_rows['Share of Voice by Topic']) == 6
    assert len(content_rows['Position by Engine']) == 6
    assert len(content_rows['Visibility Funnel']) == 4
    assert len(content_rows['Citation Domains']) == 6
    assert len(content_rows['Language of the Market']) == 11
    all_topics = [r for r in content_rows['Share of Voice by Topic'] if r[0] == 'ALL TOPICS'][0]
    assert all_topics[1:5] == ['815', '3', '47', '38']
    questions = content_rows['Market Questions']
    assert sum(int(r[4]) > 0 for r in questions) == 3
    assert sum(r[6].strip().lower() == 'win' for r in questions) == 0
    assert len({r[8] for r in questions}) == 1 and questions[0][8] == '2026-11-02'
    funnel = content_rows['Visibility Funnel']
    assert funnel[0][1:3] == ['48', '100%']
    assert funnel[-1][1:3] == ['1', '2.1%']
    assert len({r[3] for r in funnel}) == 1 and funnel[0][3] == 'Latest week'
    result = {
        'workbook': FILE.name,
        'capture': questions[0][8],
        'sheet_names': list(sheets),
        'data_rows_by_sheet': {name: len(rows) for name, rows in content_rows.items()},
        'all_topics': dict(answers=815, union_coop_percent=3, carrefour_percent=47, lulu_percent=38),
        'question_results': dict(appeared=3, wins=0, supplied_questions=12),
        'funnel': dict(answers_analysed=48, recommended=1, recommended_percent='2.1%'),
        'conclusion': 'Raw XLSX structure and key values validated. TypeScript parser/runtime tests require npm dependencies.',
    }
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
