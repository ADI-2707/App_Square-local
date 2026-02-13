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

**Endpoint:** POST /auth/login  

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

# 2. Security Coverage

This section validates that the authentication system properly defends against unauthorized access, malformed requests, and common attack vectors.

Security validation focuses on:

- Credential validation
- JWT integrity
- Input validation
- Injection resistance
- Access control enforcement

---

## SC-01: Invalid Password Attempt

**Endpoint:** POST /auth/login  

**Input:**
```json
{
  "username": "admin",
  "password": "wrongpassword"
}
```
**Expected Result:**
- HTTP 401 Unauthorized
- Message: "Invalid credentials"

**Result:** PASS

---

## SC-02: Invalid Username Attempt

**Endpoint:** POST /auth/login  

**Input:**
```json
{
  "username": "unknown_user",
  "password": "admin123"
}
```
**Expected Result:**
- HTTP 401 Unauthorized

**Result:** PASS

---

## SC-03: SQL Injection Attempt in Username

**Endpoint:** POST /auth/login  

**Input:**
```json
{
  "username": "admin' OR '1'='1",
  "password": "admin123"
}
```
**Expected Result:**
- HTTP 401 Unauthorized
- No bypass of authentication

**Security Reasoning:**
SQLAlchemy uses parameterized queries, preventing SQL injection execution.

**Result:** PASS

---

## SC-04: Access Protected Endpoint Without Token

**Endpoint:** GET /auth/profile

**Input:**
```json
{
  "username": "admin'",
  "password": "admin123"
}
```
**Header:**

**Expected Result:**
- HTTP 403 Not authenticated

**Result:** PASS

---

## SC-05: Access With Random Invalid Token

**Endpoint:** GET /auth/profile

**Input:**
```json
{
  "username": "admin'",
  "password": "admin123"
}
```
**Header:** Authorization: Bearer randomtoken123

**Expected Result:**
- HTTP 401 Unauthorized

**Result:** PASS

---

## SC-06: JWT Tampering Test

**Endpoint:** GET /auth/profile

**Input:**
```json
{
  "username": "admin'",
  "password": "admin123"
}
```
**Header:** Authorization: Bearer token->Token

**Procedure:**
- Obtain valid admin token.
- Modify one character in token.
- Use modified token for GET /auth/profile.

**Expected Result:**
- HTTP 401 Unauthorized
- Token validation failure

**Security Reasoning:**
JWT signature verification prevents tampered tokens from being accepted.

**Result:** PASS

---

## SC-07: Empty Request Body Validation

**Endpoint:** POST /auth/login

**Input:**
```json
{}
```

**Expected Result:**
- HTTP 422 Unprocessable Entity
- Missing required fields

**Result:** PASS

---

## SC-08: Missing Request Body

**Endpoint:** POST /auth/login

**Input:**
```json
(No body provided)
```

**Expected Result:**
- HTTP 422 Unprocessable Entity

**Result:** PASS

---