from __future__ import annotations

import json
import re
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUTPUT = ROOT / ".source-inspection"

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
NS_WORD = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def qname(namespace: str, name: str) -> str:
    return f"{{{namespace}}}{name}"


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    result: list[str] = []
    for item in root.findall(qname(NS_MAIN, "si")):
        result.append("".join(text.text or "" for text in item.iter(qname(NS_MAIN, "t"))))
    return result


def read_workbook(path: Path) -> dict[str, Any]:
    with zipfile.ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in relationships.findall(qname(NS_PKG_REL, "Relationship"))
        }
        shared = read_shared_strings(archive)
        sheets: list[dict[str, Any]] = []
        for sheet in workbook.find(qname(NS_MAIN, "sheets")) or []:
            name = sheet.attrib["name"]
            rel_id = sheet.attrib[qname(NS_REL, "id")]
            target = targets[rel_id].replace("\\", "/")
            if target.startswith("/"):
                sheet_path = target.lstrip("/")
            elif target.startswith("xl/"):
                sheet_path = target
            else:
                sheet_path = f"xl/{target}"
            root = ET.fromstring(archive.read(sheet_path))
            dimension = root.find(qname(NS_MAIN, "dimension"))
            merges = root.find(qname(NS_MAIN, "mergeCells"))
            rows: list[dict[str, Any]] = []
            formulas = 0
            non_empty = 0
            for row in root.iter(qname(NS_MAIN, "row")):
                values: dict[str, Any] = {}
                for cell in row.findall(qname(NS_MAIN, "c")):
                    ref = cell.attrib.get("r", "")
                    value_node = cell.find(qname(NS_MAIN, "v"))
                    formula_node = cell.find(qname(NS_MAIN, "f"))
                    inline_node = cell.find(qname(NS_MAIN, "is"))
                    raw = value_node.text if value_node is not None else None
                    cell_type = cell.attrib.get("t")
                    if cell_type == "s" and raw is not None:
                        value: Any = shared[int(raw)]
                    elif cell_type == "inlineStr" and inline_node is not None:
                        value = "".join(
                            item.text or "" for item in inline_node.iter(qname(NS_MAIN, "t"))
                        )
                    elif cell_type == "b" and raw is not None:
                        value = raw == "1"
                    elif raw is None:
                        value = None
                    else:
                        try:
                            value = float(raw)
                            if value.is_integer():
                                value = int(value)
                        except ValueError:
                            value = raw
                    entry: Any = value
                    if formula_node is not None:
                        formulas += 1
                        entry = {"formula": formula_node.text or "", "cached": value}
                    if value is not None or formula_node is not None:
                        non_empty += 1
                        values[ref] = entry
                if values:
                    rows.append({"row": int(row.attrib.get("r", "0")), "cells": values})
            sheets.append(
                {
                    "name": name,
                    "state": sheet.attrib.get("state", "visible"),
                    "dimension": dimension.attrib.get("ref") if dimension is not None else None,
                    "mergedRanges": [m.attrib.get("ref") for m in merges or []],
                    "nonEmptyCells": non_empty,
                    "formulaCells": formulas,
                    "rows": rows,
                }
            )
        return {"file": path.name, "sheets": sheets}


def read_docx(path: Path) -> dict[str, Any]:
    with zipfile.ZipFile(path) as archive:
        parts = ["word/document.xml"]
        parts.extend(
            name
            for name in archive.namelist()
            if re.fullmatch(r"word/(header|footer)\d+\.xml", name)
        )
        extracted: dict[str, list[str]] = {}
        for part in parts:
            root = ET.fromstring(archive.read(part))
            blocks: list[str] = []
            for paragraph in root.iter(qname(NS_WORD, "p")):
                text = "".join(node.text or "" for node in paragraph.iter(qname(NS_WORD, "t")))
                text = re.sub(r"\s+", " ", text).strip()
                if text:
                    blocks.append(text)
            extracted[part] = blocks
        return {
            "file": path.name,
            "parts": extracted,
            "paragraphCount": sum(len(value) for value in extracted.values()),
        }


def workbook_profile(workbook: dict[str, Any]) -> dict[str, Any]:
    profile = {"file": workbook["file"], "sheets": []}
    for sheet in workbook["sheets"]:
        populated_rows = sheet["rows"]
        preview = populated_rows[:12]
        text_values: list[str] = []
        numeric_values = 0
        for row in populated_rows:
            for entry in row["cells"].values():
                value = entry.get("cached") if isinstance(entry, dict) else entry
                if isinstance(value, str):
                    text_values.append(value.strip())
                elif isinstance(value, (int, float)):
                    numeric_values += 1
        profile["sheets"].append(
            {
                "name": sheet["name"],
                "state": sheet["state"],
                "dimension": sheet["dimension"],
                "nonEmptyCells": sheet["nonEmptyCells"],
                "formulaCells": sheet["formulaCells"],
                "numericCells": numeric_values,
                "commonText": Counter(text_values).most_common(30),
                "preview": preview,
            }
        )
    return profile


def main() -> None:
    OUTPUT.mkdir(exist_ok=True)
    workbooks = [read_workbook(path) for path in sorted((DOCS / "data").glob("*.xlsx"))]
    documents = [read_docx(path) for path in sorted((DOCS / "documentation").glob("*.docx"))]
    (OUTPUT / "workbooks-full.json").write_text(
        json.dumps(workbooks, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (OUTPUT / "workbook-profiles.json").write_text(
        json.dumps([workbook_profile(item) for item in workbooks], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (OUTPUT / "documents.json").write_text(
        json.dumps(documents, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    for document in documents:
        lines = []
        for part, paragraphs in document["parts"].items():
            lines.append(f"# {part}")
            lines.extend(paragraphs)
        target = OUTPUT / f"{Path(document['file']).stem}.txt"
        target.write_text("\n".join(lines), encoding="utf-8")
    print(
        json.dumps(
            {
                "workbooks": len(workbooks),
                "sheets": sum(len(item["sheets"]) for item in workbooks),
                "documents": len(documents),
                "output": str(OUTPUT),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
