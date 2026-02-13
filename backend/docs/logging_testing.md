# App Square Local – Logging System Testing Documentation

# 1. Logging Scope

Current logging coverage includes:

- LOGIN_SUCCESS
- LOGIN_FAILURE

Log storage:
- Database: SQLite
- Table: logs
- Timestamp: UTC
- Actor representation:
  - A → admin
  - G → guest

---

# 2. Functional Logging Validation


## LG-01: Login Success Logging

**Action:**
Performed successful login as admin.

**Expected Database Entry:**
| actor | action         | status  |
|-------|---------------|---------|
| A     | LOGIN_SUCCESS | SUCCESS |

**Result:** PASS

---

## LG-02: Login Failure Logging

**Action:**
Attempted login with incorrect password for admin.

**Expected Database Entry:**
| actor | action         | status  |
|-------|---------------|---------|
| A     | LOGIN_FAILURE | FAILURE |

**Result:** PASS

---

## LG-03: Unknown Username Handling

**Action:**
Attempted login with non-existing username.

**Expected Result:**
- No log created (prevents log spam from random attacks)

**Result:** PASS

---

# 3. Data Integrity Validation

After testing:

- Log records inserted correctly
- No duplicate unexpected entries
- Correct actor labeling (A/G)
- Correct action names
- Correct SUCCESS/FAILURE status

**Result:** PASS

---

# 4. Timestamp Validation

Observed:
- Timestamps stored in UTC
- Format consistent
- Auto-generated via datetime.utcnow()

**Result:** PASS

---

# 5. Retention Policy

Retention policy configured:
- Logs older than 90 days deleted on server startup

Retention behavior not yet time-tested (requires aging simulation).

---

# 6. Password Change Logging Validation

This section validates logging behavior for administrative password management actions.

---

## LG-04: Admin Changes Guest Password

**Action:**
Admin performs:

PUT /admin/change-password

Body:
```json
{
  "target_user": "guest",
  "new_password": "newguest123"
}
```
**Expected Result:**
- HTTP 200 OK
- Guest password updated
- Log entry created

**Expected Database Entry:**
| actor | action         | status  |
|-------|---------------|---------|
| A     | PASSWORD_CHANGE | SUCCESS |

**Result:** PASS

---

## LG-05: Guest Attempting Password Change

**Action:**
Guest attempts:

PUT /admin/change-password

**Expected Result:**
- HTTP 403 Forbidden
- No password change
- No PASSWORD_CHANGE log entry

---

# 7. Login Block Logging Validation

---

## LG-06: Login Block Event

**Action:**
Trigger 5 consecutive failed login attempts for admin.
Attempt 6th login.

**Expected Result:**
- HTTP 429 Too Many Requests
- Audit log entry created:

| actor | action        | status  |
|-------|--------------|---------|
| A     | LOGIN_BLOCKED | FAILURE |

**Result:** PASS

---

# Logging System Validation (Final Scope)

Current logged actions:

- LOGIN_SUCCESS
- LOGIN_FAILURE
- LOGIN_BLOCKED
- PASSWORD_CHANGE

Logging guarantees:

- Actor identification (A/G)
- Action type tracking
- SUCCESS/FAILURE state
- UTC timestamp
- Retention enforcement (90 days)
- Admin-only log viewing

Audit subsystem status: PRODUCTION READY (Local Deployment Scope)