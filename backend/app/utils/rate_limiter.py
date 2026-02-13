from datetime import datetime, timedelta

MAX_ATTEMPTS = 5
BLOCK_DURATION_MINUTES = 5

failed_attempts = {
    "admin": {"count": 0, "blocked_until": None},
    "guest": {"count": 0, "blocked_until": None}
}


def is_blocked(username: str):
    user_data = failed_attempts.get(username)

    if not user_data:
        return False

    blocked_until = user_data["blocked_until"]

    if blocked_until and datetime.utcnow() < blocked_until:
        return True

    return False


def record_failure(username: str):
    user_data = failed_attempts.get(username)

    if not user_data:
        return

    user_data["count"] += 1

    if user_data["count"] >= MAX_ATTEMPTS:
        user_data["blocked_until"] = datetime.utcnow() + timedelta(minutes=BLOCK_DURATION_MINUTES)
        user_data["count"] = 0


def reset_attempts(username: str):
    user_data = failed_attempts.get(username)

    if not user_data:
        return

    user_data["count"] = 0
    user_data["blocked_until"] = None
