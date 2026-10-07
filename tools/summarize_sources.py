from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".source-inspection" / "workbooks-full.json"


def simple_value(entry: Any) -> Any:
    return entry.get("cached") if isinstance(entry, dict) else entry


def row_values(row: dict[str, Any]) -> list[Any]:
    return [simple_value(value) for value in row["cells"].values()]


def looks_like_header(row: dict[str, Any]) -> bool:
    values = row_values(row)
    strings = [value for value in values if isinstance(value, str)]
    keywords = (
        "month",
        "campaign",
        "spend",
        "brand",
        "segment",
        "click",
        "revenue",
        "purchase",
        "market",
        "stage",
        "status",
    )
    hits = sum(any(keyword in value.lower() for keyword in keywords) for value in strings)
    return len(strings) >= 2 and hits >= 1


def compact_row(row: dict[str, Any]) -> str:
    values = []
    for ref, entry in row["cells"].items():
        value = simple_value(entry)
        if value is not None:
            text = str(value).replace("\n", " ")
            if len(text) > 140:
                text = text[:137] + "..."
            values.append(f"{ref}={text}")
    return " | ".join(values)


def main() -> None:
    workbooks = json.loads(SOURCE.read_text(encoding="utf-8"))
    lines: list[str] = []
    for workbook in workbooks:
        lines.append(f"\n## {workbook['file']}")
        for sheet in workbook["sheets"]:
            lines.append(
                f"\n### {sheet['name']} [{sheet['dimension']}; cells={sheet['nonEmptyCells']}; formulas={sheet['formulaCells']}]"
            )
            rows = sheet["rows"]
            candidate_rows: list[dict[str, Any]] = []
            candidate_rows.extend(rows[:3])
            candidate_rows.extend(row for row in rows[:20] if looks_like_header(row))
            if len(rows) > 4:
                candidate_rows.extend(rows[-3:])
            seen: set[int] = set()
            for row in candidate_rows:
                if row["row"] in seen:
                    continue
                seen.add(row["row"])
                lines.append(compact_row(row))
    report = "\n".join(lines)
    target = ROOT / ".source-inspection" / "summary.txt"
    target.write_text(report, encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
