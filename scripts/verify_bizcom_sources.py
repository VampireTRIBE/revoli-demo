"""Inspect packaged, unmodified XLSX records using Python standard library only.
No data is recalculated or changed. Suitable for packaging when npm is unavailable.
"""
from __future__ import annotations
import json
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

def workbook_sheets(file: Path):
    with ZipFile(file) as z:
        workbook = ET.fromstring(z.read('xl/workbook.xml'))
        names = [s.attrib.get('name','') for s in workbook.iter(MAIN+'sheet')]
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            shared=[''.join(t.text or '' for t in si.iter(MAIN+'t')) for si in root.findall(MAIN+'si')]
        result={}
        for index,name in enumerate(names,1):
            location=f'xl/worksheets/sheet{index}.xml'
            if location not in z.namelist(): continue
            xml=ET.fromstring(z.read(location)); rows=[]
            for row in xml.iter(MAIN+'row'):
                cells={}
                for cell in row.findall(MAIN+'c'):
                    ref=cell.attrib.get('r','')
                    col=''.join(x for x in ref if x.isalpha())
                    node=cell.find(MAIN+'v')
                    val=node.text if node is not None and node.text else ''
                    if cell.attrib.get('t')=='s' and val: val=shared[int(val)]
                    if cell.attrib.get('t')=='inlineStr': val=''.join(t.text or '' for t in cell.iter(MAIN+'t'))
                    cells[col]=val
                rows.append(cells)
            result[name]=rows
    return result

def records(rows, id_header='Library ID'):
    headerindex = next((i for i,r in enumerate(rows) if id_header in r.values()),None)
    if headerindex is None: return []
    header=rows[headerindex]
    col=next(k for k,v in header.items() if v==id_header)
    return [r for r in rows[headerindex+1:] if r.get(col,'').strip().isdigit()]

def verify():
    competition=ROOT/'spreadsheets data'/'competition'/'rivoli'/'EDIT-AdLibrary-Capture2-03Nov2026.xlsx'
    cleo=ROOT/'spreadsheets data'/'search'/'union-coop'/'UnionCoop-CLEO-Market-Import.xlsx'
    book=workbook_sheets(competition)
    ads=records(book.get('Ad Register',[]))
    gallery=records(book.get('Gallery - The Wall',[]))
    ad_headers=next((r for r in book['Ad Register'] if 'Library ID' in r.values()),{})
    g_headers=next((r for r in book['Gallery - The Wall'] if 'Library ID' in r.values()),{})
    def extract(rows,headers,key):
        column=next((c for c,v in headers.items() if v==key),None)
        return [r.get(column,'').strip() for r in rows] if column else []
    ids=extract(ads,ad_headers,'Library ID')
    gallery_ids=extract(gallery,g_headers,'Library ID')
    files=extract(gallery,g_headers,'Thumbnail file')
    gallery_folder=ROOT/'server'/'data'/'competition-assets'/'edit-by-ahmed-seddiqi'/'2026-11-03'
    missing=[x for x in files if not (gallery_folder/x).is_file()]
    assert len(ads)==68,(len(ads),'expected 68 register records')
    assert len(ids)==len(set(ids)),'duplicate Library IDs'
    assert len(gallery)==15,(len(gallery),'expected 15 gallery records')
    assert set(gallery_ids).issubset(set(ids)),'gallery has unregistered Library ID'
    assert not missing,missing
    cleo_sheets=list(workbook_sheets(cleo))
    required=['Market Questions','Share of Voice by Topic','Position by Engine','Visibility Funnel','Citation Domains','Language of the Market']
    assert all(s in cleo_sheets for s in required)
    return {'competition_register':len(ids),'unique_library_ids':len(set(ids)),'gallery_rows':len(gallery),'gallery_files_found':len(files),'cleo_sheets':cleo_sheets,'missing_gallery_files':missing}

if __name__=='__main__': print(json.dumps(verify(),indent=2))
