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

