"""Dependency-free OOXML audit for supplied EDIT capture 2. Does not modify workbooks."""
from collections import Counter
from datetime import date
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import posixpath

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / 'spreadsheets data/compititaion-tab/EDIT-AdLibrary-Capture2-03Nov2026.xlsx'
ASSETS = ROOT / 'server/data/competition-assets/edit-by-ahmed-seddiqi/2026-11-03'
S = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
P = '{http://schemas.openxmlformats.org/package/2006/relationships}'

def read_sheet(z, sheet_name):
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    paths = {r.get('Id'):r.get('Target') for r in rels}
    sh = next(s for s in wb.find(S+'sheets') if s.get('name') == sheet_name)
    path = paths[sh.get(R+'id')]
    path = path.lstrip('/') if path.startswith('/') else posixpath.normpath(posixpath.join('xl', path))
    root = ET.fromstring(z.read(path))
    strings=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        strings=[''.join(node.itertext()) for node in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(S+'si')]
    data=[]
    for row in root.findall('.//'+S+'sheetData/'+S+'row'):
        cells={}
        for cell in row.findall(S+'c'):
            col=''.join(c for c in cell.get('r','') if c.isalpha())
            inline=cell.find(S+'is');value=cell.find(S+'v')
            raw=''.join(inline.itertext()) if inline is not None else value.text if value is not None else ''
            if cell.get('t')=='s' and raw: raw=strings[int(raw)]
            cells[col]=raw
        data.append(cells)
    hdr=data[0]; columns={v:k for k,v in hdr.items()}
    return [{column:r.get(letter,'') for column,letter in columns.items()} for r in data[1:]]

with ZipFile(BOOK) as z:
    register=[r for r in read_sheet(z,'Ad Register') if r.get('Start date')]
    gallery=[r for r in read_sheet(z,'Gallery - The Wall') if r.get('Library ID')]
    ids=[r['Library ID'] for r in register]
    assert len(register)==68 and len(set(ids))==68, ('register', len(register),len(set(ids)))
    yes=sum(r.get('New since 1 Oct capture','').lower()=='yes' for r in register)
    assert yes==36, ('new',yes)
    tagged=sum(bool(r.get('Campaign platform (analyst)')) for r in register)
    assert tagged==15, ('campaign platform',tagged)
    days=[int(r['Days running (at 3 Nov)']) for r in register]
    assert round(sum(days)/len(days),1)==39.9, ('average',sum(days)/len(days))
    assert max(days)==168
    for r in register:
        assert (date(2026,11,3)-date.fromisoformat(r['Start date'])).days==int(r['Days running (at 3 Nov)'])
    assert len(gallery)==15 and Counter(int(r['Row']) for r in gallery)=={1:4,2:4,3:4,4:3}
    for item in gallery:
        assert item['Library ID'] in ids, item
        assert (ASSETS / item['Thumbnail file']).is_file(), item['Thumbnail file']
print('PASS 68 unique registered ads, 36 new, 15 campaign-tagged, average 39.9, max 168, zero date discrepancies')
print('PASS gallery: 15 valid ID joins, 15 images exist, rows 4/4/4/3')
