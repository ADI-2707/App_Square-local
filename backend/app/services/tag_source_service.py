from fastapi import HTTPException

from app import config
from app.queries.tag_source_queries import get_excel_tag_map


def _get_tag_map() -> dict[str, str]:
    source_kind = (config.TAG_SOURCE_KIND or "excel").strip().lower()

    if source_kind == "excel":
        return get_excel_tag_map()

    if source_kind == "database":
        raise HTTPException(
            status_code=501,
            detail="Database tag source is not implemented yet",
        )

    raise HTTPException(
        status_code=500,
        detail=f"Unsupported tag source '{config.TAG_SOURCE_KIND}'",
    )


def resolve_tag_names(source_names: list[str]) -> list[dict[str, str]]:
    cleaned_source_names = []

    for source_name in source_names:
        cleaned_name = str(source_name or "").strip()

        if not cleaned_name:
            raise HTTPException(status_code=400, detail="Tag lookup value cannot be empty")

        cleaned_source_names.append(cleaned_name)

    tag_map = _get_tag_map()
    resolved_tags = []
    missing_tags = []

    for source_name in cleaned_source_names:
        resolved_name = tag_map.get(source_name)

        if resolved_name is None:
            missing_tags.append(source_name)
            continue

        resolved_tags.append(
            {
                "lookup_value": source_name,
                "tag_name": resolved_name,
            }
        )

    if missing_tags:
        raise HTTPException(
            status_code=400,
            detail=(
                "Some tags could not be resolved from the configured tag source: "
                + ", ".join(missing_tags)
            ),
        )

    return resolved_tags

