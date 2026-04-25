from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

from app import config


MAIN_NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkg": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def _normalize_column_name(column_name: str) -> str:
    value = (column_name or "").strip().upper()

    if not value.isalpha():
        raise ValueError(f"Invalid Excel column '{column_name}'")

    return value


def _extract_column_letters(cell_reference: str) -> str:
    letters = []

    for char in cell_reference or "":
        if char.isalpha():
            letters.append(char.upper())
        else:
            break

    return "".join(letters)


def _get_shared_strings(archive: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    values = []

    for item in root.findall("main:si", MAIN_NS):
        text_parts = [node.text or "" for node in item.findall(".//main:t", MAIN_NS)]
        values.append("".join(text_parts))

    return values


def _get_sheet_path(archive: ZipFile, sheet_name: str | None) -> str:
    workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
    rel_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))

    sheet_elements = workbook_root.findall("main:sheets/main:sheet", REL_NS)

    if not sheet_elements:
        raise ValueError("Workbook does not contain any sheets")

    target_sheet = None

    if sheet_name:
        for sheet in sheet_elements:
            if sheet.attrib.get("name") == sheet_name:
                target_sheet = sheet
                break

        if target_sheet is None:
            raise ValueError(f"Sheet '{sheet_name}' was not found in the workbook")
    else:
        target_sheet = sheet_elements[0]

    relationship_id = target_sheet.attrib.get(
        "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    )

    for relationship in rel_root.findall("pkg:Relationship", REL_NS):
        if relationship.attrib.get("Id") == relationship_id:
            target = relationship.attrib.get("Target", "")
            return f"xl/{target}" if not target.startswith("xl/") else target

    raise ValueError("Could not resolve worksheet relationship in workbook")


def _read_cell_value(cell, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")

    if cell_type == "inlineStr":
        text_parts = [node.text or "" for node in cell.findall(".//main:t", MAIN_NS)]
        return "".join(text_parts).strip()

    value_node = cell.find("main:v", MAIN_NS)

    if value_node is None or value_node.text is None:
        return ""

    raw_value = value_node.text

    if cell_type == "s":
        return shared_strings[int(raw_value)].strip()

    return raw_value.strip()


def get_excel_tag_map() -> dict[str, str]:
    workbook_path = (config.TAG_SOURCE_EXCEL_PATH or "").strip()

    if not workbook_path:
        raise ValueError("TAG_SOURCE_EXCEL_PATH is not configured")

    file_path = Path(workbook_path)

    if not file_path.exists():
        raise ValueError(f"Excel tag source file was not found: {file_path}")

    lookup_column = _normalize_column_name(config.TAG_SOURCE_LOOKUP_COLUMN)
    value_column = _normalize_column_name(config.TAG_SOURCE_VALUE_COLUMN)
    sheet_name = (config.TAG_SOURCE_EXCEL_SHEET or "").strip() or None

    with ZipFile(file_path, "r") as archive:
        shared_strings = _get_shared_strings(archive)
        sheet_path = _get_sheet_path(archive, sheet_name)
        worksheet_root = ET.fromstring(archive.read(sheet_path))

    tag_map = {}

    for row in worksheet_root.findall("main:sheetData/main:row", MAIN_NS):
        row_values = {}

        for cell in row.findall("main:c", MAIN_NS):
            column = _extract_column_letters(cell.attrib.get("r", ""))

            if column:
                row_values[column] = _read_cell_value(cell, shared_strings)

        lookup_value = row_values.get(lookup_column, "").strip()
        resolved_value = row_values.get(value_column, "").strip()

        if lookup_value and resolved_value and lookup_value not in tag_map:
            tag_map[lookup_value] = resolved_value

    return tag_map

