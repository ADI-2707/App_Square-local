# App Square Local – Authentication Testing Documentation

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

**Objective:** To verify system auto-creates exactly two accounts on fresh database.

**Steps:**
1. Deleted existing SQLite database file.
2. Restarted server.
3. Inspected users table.

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

**Endpoint:** GET /auth/profile
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

**Endpoint:** GET /auth/profile
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

**Objective:**  To ensure repeated valid login requests do not destabilize system.

**Method:**
- Sent 10–15 rapid login requests using valid admin credentials.

**Expected Result:**
- All responses returned HTTP 200
- No server crashed
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
- Obtained valid admin token.
- Modified one character in token.
- Used modified token for GET /auth/profile.

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
# 3. Stability Coverage

This section validates system behavior under repeated usage and verifies operational stability during normal load conditions.

Focus areas:
- Server uptime reliability
- Repeated authentication handling
- Database integrity
- Resource stability
- Consistent response performance

---

## ST-01: Rapid Repeated Login Requests

**Objective:** tp verify server stability under burst login requests.

**Method:**
- Sent 10–15 rapid POST /auth/login requests using valid admin credentials.

**Observed Metrics:**
- HTTP 200 responses for all requests
- Response time range: 8ms – 37ms (local environment)
- No server crash
- No memory spike
- No unhandled exceptions

**Expected Result:**
- Stable responses
- No service interruption

**Result:** PASS

---

## ST-02: Repeated Token-Protected Access

**Objective:** to ensure protected endpoint remains stable under repeated access.

**Method:**
- Called GET /auth/profile multiple times using valid admin token.

**Expected Result:**
- HTTP 200 for each request
- Consistent response payload
- No authentication degradation

**Result:** PASS

---

## ST-03: Server Restart Behavior

**Objective:** To validate proper initialization behavior after restart.

**Procedure:**
1. Stopped server.
2. Restarted application.
3. Verified user records.

**Expected Result:**
- No duplicate user creation.
- Only two users exist in database.
- System initializes without error.

**Result:** PASS

---

## ST-04: Database Integrity Validation

**Objective:** To ensure no duplicate records or unintended data creation during stress testing.

**Method:**
- Inspected SQLite users table after repeated login attempts.

**Expected Result:**
| id | username | role  |
|----|----------|-------|
| 1  | admin    | admin |
| 2  | guest    | guest |

- No additional records created.
- No data corruption observed.

**Result:** PASS

---

## ST-05: Authentication Failure Stability

**Objective:** To ensure repeated invalid login attempts do not destabilize system.

**Method:**
- Sent multiple incorrect password attempts.

**Expected Result:**
- HTTP 401 responses
- No server crash
- No unexpected exception

**Result:** PASS

---

# 4. Rate Limiting & Account Lockout Validation

Login rate limiting is configured with:

- Maximum failed attempts: 5
- Lock duration: 5 minutes
- Applies per user (admin / guest)
- Lock state stored in memory
- Successful login resets counter

---

## RL-01: Failed Login Attempts Increment Counter

**Action:**
Attempted login with incorrect password for admin 5 times consecutively.

**Expected Result:**
- All 5 attempts returned HTTP 401 Unauthorized
- LOGIN_FAILURE logs created
- Account not yet blocked

**Result:** PASS

---

## RL-02: Account Lock Trigger

**Action:**
Attempted 6th login after 5 consecutive failures.

**Expected Result:**
- HTTP 429 Too Many Requests
- Response message:
  "Account temporarily locked due to multiple failed login attempts"
- LOGIN_BLOCKED audit log entry created

**Result:** PASS

---

## RL-03: Successful Login Resets Counter

**Action:**
Waited for lock duration OR restart server.
Then perform correct login.

**Expected Result:**
- HTTP 200 OK
- LOGIN_SUCCESS logged
- Failure counter reset

**Result:** PASS

---

## RL-04: Guest Isolation

**Action:**
Trigger lock for admin.
Attempt guest login.

**Expected Result:**
- Guest login unaffected
- Lock applies per user

**Result:** PASS

---