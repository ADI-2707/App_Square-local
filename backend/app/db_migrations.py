from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


TARGET_LOG_ACTOR_LENGTH = 20
LAST_MIGRATION_STATUS = "not_run"
LAST_MIGRATION_MESSAGE = ""


def _should_expand_actor_column(actor_column: dict) -> bool:
    actor_type = actor_column.get("type")
    current_length = getattr(actor_type, "length", None)

    # If length is unknown, avoid unsafe assumptions.
    if current_length is None:
        return False

    return current_length < TARGET_LOG_ACTOR_LENGTH


def _migrate_logs_actor_column(engine: Engine):
    with engine.begin() as conn:
        inspector = inspect(conn)

        if not inspector.has_table("logs"):
            return

        columns = {column["name"]: column for column in inspector.get_columns("logs")}
        actor_column = columns.get("actor")

        if not actor_column or not _should_expand_actor_column(actor_column):
            return

        dialect_name = engine.dialect.name

        if dialect_name == "mssql":
            conn.execute(
                text(
                    "ALTER TABLE logs ALTER COLUMN actor NVARCHAR(20) NOT NULL"
                )
            )
            return

        # SQLite does not enforce VARCHAR lengths strictly and altering column
        # type requires table rebuild; skip it for dev ergonomics.
        if dialect_name == "sqlite":
            return

        print(
            f"LOG_MIGRATION_SKIPPED: unsupported dialect '{dialect_name}' for logs.actor expansion."
        )


def run_startup_migrations(engine: Engine):
    global LAST_MIGRATION_STATUS, LAST_MIGRATION_MESSAGE
    try:
        _migrate_logs_actor_column(engine)
        LAST_MIGRATION_STATUS = "ok"
        LAST_MIGRATION_MESSAGE = "logs.actor migration check completed"
    except Exception as exc:
        LAST_MIGRATION_STATUS = "failed"
        LAST_MIGRATION_MESSAGE = str(exc)
        print("LOG_MIGRATION_FAILURE", str(exc))


def get_actor_column_health(engine: Engine) -> dict:
    try:
        with engine.begin() as conn:
            inspector = inspect(conn)

            if not inspector.has_table("logs"):
                return {"actor_column_ok": False, "message": "logs table missing"}

            columns = {column["name"]: column for column in inspector.get_columns("logs")}
            actor_column = columns.get("actor")

            if not actor_column:
                return {"actor_column_ok": False, "message": "actor column missing"}

            actor_type = actor_column.get("type")
            current_length = getattr(actor_type, "length", None)

            if current_length is None:
                return {"actor_column_ok": True, "message": "actor length not enforced by engine"}

            is_ok = current_length >= TARGET_LOG_ACTOR_LENGTH
            return {
                "actor_column_ok": is_ok,
                "message": f"actor length is {current_length}",
            }

    except Exception as exc:
        return {"actor_column_ok": False, "message": f"actor health check failed: {exc}"}


def get_migration_health() -> dict:
    return {
        "migration_status": LAST_MIGRATION_STATUS,
        "migration_message": LAST_MIGRATION_MESSAGE,
    }
