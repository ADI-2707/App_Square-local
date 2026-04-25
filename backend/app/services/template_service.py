from sqlalchemy.orm import Session
from app.queries import template_queries
from app.queries.template_queries import get_device_with_tags, get_templates_filtered
from app.services.tag_source_service import resolve_tag_names, search_tag_names

def get_all_groups(db: Session):
    return template_queries.get_all_groups(db)


def get_devices_by_group(db: Session, group_id: int):
    return template_queries.get_devices_by_group(db, group_id)


def get_tags_by_device(db: Session, device_id: int):
    return template_queries.get_tags_by_device(db, device_id)


def get_full_template(db: Session, template_group_id: int):
    return template_queries.get_full_template(db, template_group_id)


def get_device_full(db: Session, device_id: int):
    return get_device_with_tags(db, device_id)


def get_resolved_tags(tag_names: list[str]):
    return resolve_tag_names(tag_names)


def search_available_tags(search: str, limit: int):
    return search_tag_names(search, limit)


def get_templates_advanced(
    db: Session,
    search: str,
    sort: str,
    date_filter: str,
    page: int,
    limit: int
):
    skip = (page - 1) * limit

    results, total = get_templates_filtered(
        db=db,
        search=search,
        sort=sort,
        date_filter=date_filter,
        skip=skip,
        limit=limit
    )

    return {
        "data": results,
        "total": total
    }
