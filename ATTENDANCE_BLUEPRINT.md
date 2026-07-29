# RCMS Attendance Domain Architecture Blueprint

Version: 1.0.0  
Status: Architecture Blueprint Approved  
Author: Senior Software Engineer (Antigravity)  
Approved By: RCMS CTO  

---

# 1. Domain Overview & Executive Summary

The **Attendance Domain** is the core operational engine of RCMS responsible for session management, fast QR-code event check-ins, volunteer scanner passcode validation, manual attendance logging, and points generation interfacing directly with the Points Ledger.

---

# 2. Core Entities & Relational Schema Definition

## 2.1 `attendance_sessions`
- **Purpose:** Defines an attendance-taking event (meeting, workshop, project session).
- **Columns:**
  - `id`: UUID PK
  - `title`: VARCHAR(100) NOT NULL
  - `date`: DATE NOT NULL
  - `start_time`: TIME NOT NULL
  - `end_time`: TIME NOT NULL
  - `attendance_points`: INT NOT NULL DEFAULT 10
  - `late_threshold`: INT NOT NULL DEFAULT 15 (minutes past start_time)
  - `late_points`: INT NOT NULL DEFAULT 5
  - `status`: VARCHAR(20) DEFAULT 'draft' (draft, scheduled, active, paused, closed, archived)
  - Base Metadata (`created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, `deleted_by`, `version`)

## 2.2 `volunteer_codes`
- **Purpose:** Authorizes volunteer scanner devices to record student check-ins without full admin access.
- **Columns:**
  - `id`: UUID PK
  - `session_id`: UUID FK -> attendance_sessions.id (ON DELETE CASCADE)
  - `code`: VARCHAR(20) UNIQUE NOT NULL (6-digit alphanumeric PIN)
  - `status`: VARCHAR(20) DEFAULT 'unused' (unused, active, expired, revoked)
  - `expires_at`: TIMESTAMP WITH TIME ZONE NOT NULL
  - `activated_by`: UUID FK -> users.id
  - `activated_at`: TIMESTAMP WITH TIME ZONE

## 2.3 `attendance_records`
- **Purpose:** Stores individual student check-in events.
- **Columns:**
  - `id`: UUID PK
  - `member_id`: UUID FK -> members.id (ON DELETE RESTRICT)
  - `session_id`: UUID FK -> attendance_sessions.id (ON DELETE RESTRICT)
  - `scan_time`: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  - `points`: INT NOT NULL
  - `late`: BOOLEAN NOT NULL DEFAULT FALSE
  - `volunteer_user`: UUID FK -> users.id
  - `method`: VARCHAR(20) DEFAULT 'qr' (qr, manual)
  - `remarks`: TEXT
  - Composite Unique Constraint on (`member_id`, `session_id`)

---

# 3. Entity Lifecycles

## 3.1 Attendance Session Lifecycle

```
[ Draft ] ──(Schedule)──> [ Scheduled ] ──(Open Session)──> [ Active ]
                                                               │  ▲
                                                     (Pause)   │  │ (Resume)
                                                               ▼  │
                                                            [ Paused ]
                                                               │
                                                       (Close Session)
                                                               ▼
                                                           [ Closed ] ──(Lock/Archive)──> [ Archived ]
```

- **Draft:** Session configured by Event Coordinator; editable.
- **Scheduled:** Session published; waiting for start date/time.
- **Active:** QR Scanner active, volunteer codes generated and validating scans.
- **Paused:** Temporary pause on incoming scans.
- **Closed:** Attendance taking ended; points ledger entries generated and locked.
- **Archived:** Historical record locked against further modifications.

## 3.2 Attendance Record Lifecycle

```
[ Scanned / Logged ] ──(Points Ledger Entry Inserted)──> [ Verified ] ──(Admin Edit)──> [ Adjusted / Audit Logged ]
```

---

# 4. Business Workflows

1. **Create Session Workflow:**
   - Coordinator specifies title, date, start/end time, points weight, late threshold minutes, and late points multiplier.
   - Initial status set to `draft` or `scheduled`.

2. **Scanner Activation & Volunteer Workflow:**
   - Admin/Coordinator launches active session, generating a 6-digit `volunteer_code` with an expiration timer (e.g. 4 hours).
   - Volunteer enters PIN on mobile scanner app; system issues temporary scanner token.

3. **QR Check-in Workflow:**
   - Student presents dynamic/static QR code containing `member_id` or `roll_number`.
   - Volunteer scanner posts scan payload to server.
   - Server checks:
     a. Session status is `active`.
     b. Member exists and is active.
     c. Unique constraint check: Member has not already scanned into this session (`ATTENDANCE_ALREADY_MARKED` error if duplicate).
     d. Evaluates timestamp vs `start_time + late_threshold`. If late, sets `late = true` and `points = late_points`.
   - Record created; transaction automatically posts an immutable entry to `points_ledger`.

4. **Manual Marking Workflow:**
   - Executive user manually searches member and logs attendance (method = `manual`, remarks required).

5. **Session Closing & Audit Workflow:**
   - Coordinator marks session `closed`. Volunteer codes are invalidated (`status = 'expired'`). Session locked against scan modifications.

---

# 5. Permission Matrix

| Role | Create Session | Activate / Open | QR Scan Marking | Manual Marking | Edit / Adjust | Close Session | View Reports |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **President / VP** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Event Coordinator** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Volunteer** | No | No | Yes (via Code) | No | No | No | No |
| **Member** | No | No | No (Presents QR) | No | No | No | Self Only |

---

# 6. Risk Assessment & Mitigations

1. **Duplicate Check-in Risk:** Simultaneous scanning of same student QR code by two volunteers.  
   *Mitigation:* Database composite unique constraint on `attendance_records(member_id, session_id)` with database-level error trapping (`ATTENDANCE_ALREADY_MARKED`).
2. **Expired Volunteer Code Usage:** Scanner devices continuing to post check-ins after session end.  
   *Mitigation:* Middleware checks `volunteer_codes.expires_at > NOW()` and `attendance_sessions.status == 'active'` on every scan API request.
3. **Points Ledger Discrepancy:** Deleting or editing an attendance record without adjusting member points.  
   *Mitigation:* Points are recorded in `points_ledger` via atomic database service workflows. Manual record edits generate balancing ledger transactions.

---

# 7. Performance & Query Patterns

- **Primary Query Patterns:**
  - `GET /api/attendance/session/:id/records` $\rightarrow$ Query records by `session_id`.
  - `GET /api/attendance/member/:id/history` $\rightarrow$ Query records by `member_id`.
- **Required Database Indexes:**
  - Index on `attendance_records(session_id)`
  - Index on `attendance_records(member_id)`
  - Unique Index on `attendance_records(member_id, session_id)`
  - Unique Index on `volunteer_codes(code)`

---

# END OF FILE
