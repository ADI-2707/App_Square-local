from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


TARGET_LOG_ACTOR_LENGTH = 20


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
    try:
        _migrate_logs_actor_column(engine)
    except Exception as exc:
        print("LOG_MIGRATION_FAILURE", str(exc))
