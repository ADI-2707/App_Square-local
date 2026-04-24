from pathlib import Path
from zipfile import ZipFile

from app import config
from app.models.tag import Tag


def get_token(client, username="admin", password="admin123"):
    response = client.post("/auth/login", json={
        "username": username,
        "password": password
    })
    return response.json()["access_token"]


def write_test_workbook(path: Path, rows: list[tuple[str, str]]):
    sheet_rows = []

    for index, (left, right) in enumerate(rows, start=1):
        sheet_rows.append(
            (
                f'<row r="{index}">'
                f'<c r="A{index}" t="inlineStr"><is><t>{left}</t></is></c>'
                f'<c r="B{index}" t="inlineStr"><is><t>{right}</t></is></c>'
                f'</row>'
            )
        )

    workbook_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
 <sheets>
  <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
 </sheets>
</workbook>"""

    workbook_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1"
  Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
  Target="worksheets/sheet1.xml"/>
</Relationships>"""

    root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1"
  Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
  Target="xl/workbook.xml"/>
</Relationships>"""

    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="xml" ContentType="application/xml"/>
 <Override PartName="/xl/workbook.xml"
  ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
 <Override PartName="/xl/worksheets/sheet1.xml"
  ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>"""

    worksheet_xml = (
        """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <sheetData>"""
        + "".join(sheet_rows)
        + """</sheetData>
</worksheet>"""
    )

    with ZipFile(path, "w") as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", root_rels)
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        archive.writestr("xl/worksheets/sheet1.xml", worksheet_xml)


def configure_excel_source(monkeypatch, workbook_path: Path):
    monkeypatch.setattr(config, "TAG_SOURCE_KIND", "excel")
    monkeypatch.setattr(config, "TAG_SOURCE_EXCEL_PATH", str(workbook_path))
    monkeypatch.setattr(config, "TAG_SOURCE_EXCEL_SHEET", "Sheet1")
    monkeypatch.setattr(config, "TAG_SOURCE_LOOKUP_COLUMN", "A")
    monkeypatch.setattr(config, "TAG_SOURCE_VALUE_COLUMN", "B")


def test_resolve_tags_route_returns_column_b_values(client, monkeypatch, tmp_path):
    workbook_path = tmp_path / "tag-source.xlsx"
    write_test_workbook(
        workbook_path,
        [
            ("DriveAlarmFb", "Applications.Area.DriveAlarmFb"),
            ("DriveHealthyFb", "Applications.Area.DriveHealthyFb"),
        ],
    )
    configure_excel_source(monkeypatch, workbook_path)
    token = get_token(client)

    response = client.post(
        "/templates/tags/resolve",
        headers={"Authorization": f"Bearer {token}"},
        json={"tags": ["DriveAlarmFb", "DriveHealthyFb"]},
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "lookup_value": "DriveAlarmFb",
            "tag_name": "Applications.Area.DriveAlarmFb",
        },
        {
            "lookup_value": "DriveHealthyFb",
            "tag_name": "Applications.Area.DriveHealthyFb",
        },
    ]


def test_template_creation_uses_resolved_tag_names_without_lowercasing(
    client,
    db_session,
    monkeypatch,
    tmp_path,
):
    workbook_path = tmp_path / "tag-source.xlsx"
    write_test_workbook(
        workbook_path,
        [
            ("DriveAlarmFb", "Applications.Area.DriveAlarmFb"),
            ("DriveHealthyFb", "Applications.Area.DriveHealthyFb"),
        ],
    )
    configure_excel_source(monkeypatch, workbook_path)
    token = get_token(client)

    response = client.post(
        "/templates/full",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "TemplateA",
            "devices": [
                {
                    "name": "MotorA",
                    "type": "generic",
                    "tags": [
                        {"name": "DriveAlarmFb"},
                        {"name": "DriveHealthyFb"},
                    ],
                }
            ],
        },
    )

    assert response.status_code == 200

    saved_tags = db_session.query(Tag).order_by(Tag.name.asc()).all()

    assert [tag.name for tag in saved_tags] == [
        "Applications.Area.DriveAlarmFb",
        "Applications.Area.DriveHealthyFb",
    ]


def test_template_creation_blocks_duplicate_resolved_tags(
    client,
    monkeypatch,
    tmp_path,
):
    workbook_path = tmp_path / "tag-source.xlsx"
    write_test_workbook(
        workbook_path,
        [
            ("DriveOffRqPrimary", "Applications.Area.DriveOffOp"),
            ("DriveOffRqBackup", "Applications.Area.DriveOffOp"),
        ],
    )
    configure_excel_source(monkeypatch, workbook_path)
    token = get_token(client)

    response = client.post(
        "/templates/full",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "TemplateB",
            "devices": [
                {
                    "name": "MotorB",
                    "type": "generic",
                    "tags": [
                        {"name": "DriveOffRqPrimary"},
                        {"name": "DriveOffRqBackup"},
                    ],
                }
            ],
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Duplicate resolved tag 'Applications.Area.DriveOffOp' in device 'MotorB'"
    )
