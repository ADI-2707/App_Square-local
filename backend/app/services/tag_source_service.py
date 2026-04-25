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

    tag_values = set(tag_map.values())

    for source_name in cleaned_source_names:
        resolved_name = tag_map.get(source_name)

        if resolved_name is None and source_name in tag_values:
            resolved_name = source_name

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


def search_tag_names(search: str, limit: int = 10) -> list[dict[str, str]]:
    query = (search or "").strip().lower()

    if not query:
        return []

    tag_map = _get_tag_map()
    matches = []

    for lookup_value, tag_name in tag_map.items():
        lookup_text = lookup_value.lower()
        tag_text = tag_name.lower()

        if query not in lookup_text and query not in tag_text:
            continue

        score = 0

        if tag_text.startswith(query):
            score += 3
        elif query in tag_text:
            score += 2

        if lookup_text.startswith(query):
            score += 2
        elif query in lookup_text:
            score += 1

        matches.append(
            {
                "lookup_value": lookup_value,
                "tag_name": tag_name,
                "_score": score,
            }
        )

    matches.sort(key=lambda item: (-item["_score"], item["tag_name"], item["lookup_value"]))

    unique_matches = []
    seen = set()

    for item in matches:
        dedupe_key = item["tag_name"].strip().lower()

        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)
        unique_matches.append(
            {
                "lookup_value": item["lookup_value"],
                "tag_name": item["tag_name"],
            }
        )

        if len(unique_matches) >= limit:
            break

    return unique_matches
