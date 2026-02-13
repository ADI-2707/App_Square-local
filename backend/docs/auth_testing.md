# App Square Local – Authentication Testing Documentation

---

# 1. Functional Coverage

This section validates that the authentication system behaves correctly under normal operating conditions.

System Model:
- Fixed two-user system
- Users: admin, guest
- Authentication: JWT-based
- Password storage: bcrypt hashed
- Database: SQLite

---

## FC-01: System Initialization

**Objective:** Verify system auto-creates exactly two accounts on fresh database.

**Steps:**
1. Delete existing SQLite database file.
2. Restart server.
3. Inspect users table.

**Expected Result:**
- Exactly 2 records exist.
- Users:
  - admin (role: admin)
  - guest (role: guest)

**Result:** PASS

---

## FC-02: Admin Login (Valid Credentials)

**Endpoint:** POST /auth/login  
**Input:**
```json
{
  "username": "admin",
  "password": "admin123"
}

```

**Expected Result:**
- HTTP 200
- JWT access token returned
- token_type = bearer

**Result:** PASS



## FC-03: Guest Login (Valid Credentials)

**Endpoint:** POST /auth/login  
**Input:**
```json
{
  "username": "guest",
  "password": "guest123"
}
```

**Expected Result:**
- HTTP 200
- JWT access token returned

**Result:** PASS

---

## FC-04: Profile Access (Admin)

**Endpoint:** POST /auth/profile
**Header:**  
**Authorization:** Bearer <guest_token>
**Input:**
```json
{
  "username": "admin",
  "role": "admin"
}
```

**Result:** PASS

---

## FC-04: Profile Access (Guest)

**Endpoint:** POST /auth/profile
**Header:**  
**Authorization:** Bearer <guest_token>
**Input:**
```json
{
  "username": "guest",
  "role": "guest"
}
```

**Result:** PASS

---

## FC-06: Multiple Rapid Login Attempts

**Objective:**  Ensure repeated valid login requests do not destabilize system.

**Method:**
- Send 10–15 rapid login requests using valid admin credentials.

**Expected Result:**
- All responses return HTTP 200
- No server crash
- Stable response time (< 50ms local)

**Observed Result:**
- Stable response time (< 50ms local)
- Response time range: 8ms – 37ms

**Result:** PASS

---