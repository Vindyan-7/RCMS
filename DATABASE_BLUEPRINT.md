# RCMS Master Database Blueprint

Version: 1.0.0  
Status: Architectural Blueprint Approved  
Author: Senior Software Engineer (Antigravity)  
Approved By: RCMS CTO  

---

# 1. Executive Summary

The **RCMS Database Blueprint** defines the complete relational data architecture for the Robotics Club Management System. The design adheres strictly to **Third Normal Form (3NF)**, **Domain-Driven Isolation**, **Immutable Transactional Accounting (Points Ledger)**, and **Soft Deletion (`deleted_at`)**.

Primary keys use **UUID v4** internally across all domain entities, preserving external human-readable identifiers (`SAC-RC-YYNNN` for members, `2026-27` for academic years).

---

# 2. Entity Inventory & Schema Definition

## 2.1 Academic Domain
1. `academic_years`
   - **Purpose:** Defines academic calendar years.
   - **Columns:** `id` (UUID PK), `name` (VARCHAR UQ, e.g. "2026-27"), `start_date` (DATE), `end_date` (DATE), `status` (VARCHAR: active/inactive), Base metadata (`created_at`, `updated_at`, `created_by`, `updated_by`).
2. `semesters`
   - **Purpose:** Tracks terms per academic year.
   - **Columns:** `id` (UUID PK), `academic_year_id` (UUID FK -> academic_years.id), `name` (VARCHAR, e.g. "Semester III"), `start_date` (DATE), `end_date` (DATE), `status` (VARCHAR: active/inactive), Base metadata.

## 2.2 Security & Administration Domain
3. `roles`
   - **Purpose:** RBAC role definitions.
   - **Columns:** `id` (UUID PK), `name` (VARCHAR UQ), `description` (TEXT).
4. `permissions`
   - **Purpose:** Granular action authorization keys.
   - **Columns:** `id` (UUID PK), `module` (VARCHAR), `action` (VARCHAR), UQ constraint on (`module`, `action`).
5. `role_permissions`
   - **Purpose:** Many-to-many junction linking roles to permissions.
   - **Columns:** `role_id` (UUID FK -> roles.id), `permission_id` (UUID FK -> permissions.id), Composite PK (`role_id`, `permission_id`).
6. `users`
   - **Purpose:** Staff administrative website users.
   - **Columns:** `id` (UUID PK), `name` (VARCHAR), `email` (VARCHAR UQ), `password_hash` (VARCHAR), `role_id` (UUID FK -> roles.id), `status` (VARCHAR: active/disabled), `last_login` (TIMESTAMP), Base metadata, `deleted_at`.
7. `system_settings`
   - **Purpose:** Dynamic configuration parameters.
   - **Columns:** `key` (VARCHAR PK), `value` (TEXT), `description` (TEXT), `updated_at` (TIMESTAMP), `updated_by` (UUID).
8. `audit_logs`
   - **Purpose:** Immutable append-only administrative transaction audit trail.
   - **Columns:** `id` (UUID PK), `user_id` (UUID FK -> users.id), `module` (VARCHAR), `action` (VARCHAR), `old_value` (JSONB), `new_value` (JSONB), `ip` (VARCHAR), `browser` (VARCHAR), `created_at` (TIMESTAMP).

## 2.3 Identity & Members Domain
9. `members`
   - **Purpose:** Stores permanent member personal identity.
   - **Columns:** `id` (UUID PK), `member_id` (VARCHAR UQ, format SAC-RC-YYNNN), `roll_number` (VARCHAR UQ), `name` (VARCHAR), `email` (VARCHAR UQ), `phone` (VARCHAR), `gender` (VARCHAR), `photo_url` (TEXT), `branch` (VARCHAR), `year` (INT), `status` (VARCHAR: active/inactive/alumni/suspended), Base metadata, `deleted_at`.
10. `memberships`
    - **Purpose:** Semester-specific member enrollment and renewal state.
    - **Columns:** `id` (UUID PK), `member_id` (UUID FK -> members.id), `academic_year_id` (UUID FK -> academic_years.id), `semester_id` (UUID FK -> semesters.id), `status` (VARCHAR: active/inactive/renewed), Base metadata.

## 2.4 Attendance Domain
11. `attendance_sessions`
    - **Purpose:** Attendance session definitions.
    - **Columns:** `id` (UUID PK), `title` (VARCHAR), `date` (DATE), `start_time` (TIME), `end_time` (TIME), `attendance_points` (INT), `late_threshold` (INT), `late_points` (INT), `status` (VARCHAR: draft/scheduled/active/paused/closed/archived), Base metadata.
12. `volunteer_codes`
    - **Purpose:** Passcode keys for volunteer scanner authorization.
    - **Columns:** `id` (UUID PK), `session_id` (UUID FK -> attendance_sessions.id), `code` (VARCHAR UQ), `status` (VARCHAR: unused/active/expired/revoked), `expires_at` (TIMESTAMP), `activated_by` (UUID FK -> users.id), `activated_at` (TIMESTAMP).
13. `attendance_records`
    - **Purpose:** Individual attendance scan logs.
    - **Columns:** `id` (UUID PK), `member_id` (UUID FK -> members.id), `session_id` (UUID FK -> attendance_sessions.id), `scan_time` (TIMESTAMP), `points` (INT), `late` (BOOLEAN), `volunteer_user` (UUID FK -> users.id), `method` (VARCHAR: qr/manual), `remarks` (TEXT), UQ constraint on (`member_id`, `session_id`).

## 2.5 Activities & Points Domain
14. `tasks`
    - **Purpose:** Task & assignment definitions.
    - **Columns:** `id` (UUID PK), `title` (VARCHAR), `description` (TEXT), `points` (INT), `status` (VARCHAR: draft/active/completed/archived), Base metadata, `deleted_at`.
15. `task_completions`
    - **Purpose:** Member task submission completion logs.
    - **Columns:** `id` (UUID PK), `task_id` (UUID FK -> tasks.id), `member_id` (UUID FK -> members.id), `completed_by` (UUID FK -> users.id), `completed_at` (TIMESTAMP), UQ constraint on (`task_id`, `member_id`).
16. `events`
    - **Purpose:** Event definitions.
    - **Columns:** `id` (UUID PK), `name` (VARCHAR), `description` (TEXT), `venue` (VARCHAR), `start_date` (TIMESTAMP), `end_date` (TIMESTAMP), `points` (INT), `status` (VARCHAR: upcoming/active/completed/cancelled/archived), Base metadata, `deleted_at`.
17. `event_participations`
    - **Purpose:** Event attendance verification.
    - **Columns:** `id` (UUID PK), `event_id` (UUID FK -> events.id), `member_id` (UUID FK -> members.id), `verified_by` (UUID FK -> users.id), `verified_at` (TIMESTAMP), UQ constraint on (`event_id`, `member_id`).
18. `points_ledger`
    - **Purpose:** Immutable financial-grade transaction ledger for member points.
    - **Columns:** `id` (UUID PK), `member_id` (UUID FK -> members.id), `category` (VARCHAR: attendance/task/event/bonus/adjustment), `reference_type` (VARCHAR: attendance_records/task_completions/event_participations/manual), `reference_id` (UUID), `points` (INT), `created_by` (UUID FK -> users.id), `created_at` (TIMESTAMP), `remarks` (TEXT).

## 2.6 Inventory Domain
19. `inventory_items`
    - **Purpose:** Equipment stock & component catalog.
    - **Columns:** `id` (UUID PK), `name` (VARCHAR), `category` (VARCHAR), `quantity` (INT), `available` (INT), `condition` (VARCHAR), `remarks` (TEXT), Base metadata, `deleted_at`.
20. `inventory_borrowings`
    - **Purpose:** Equipment checkout and return records.
    - **Columns:** `id` (UUID PK), `inventory_id` (UUID FK -> inventory_items.id), `member_id` (UUID FK -> members.id), `quantity` (INT), `issue_date` (TIMESTAMP), `return_date` (TIMESTAMP), `status` (VARCHAR: borrowed/returned/overdue), `condition_on_return` (VARCHAR), `issued_by` (UUID FK -> users.id), `returned_by` (UUID FK -> users.id), `remarks` (TEXT).

---

# 3. Entity Relationships & Cascade Rules

```
academic_years ──(1:N, Restrict Delete)──> semesters ──(1:N, Restrict Delete)──> memberships
members        ──(1:N, Cascade Delete)──> memberships
members        ──(1:N, Restrict Delete)──> attendance_records
members        ──(1:N, Restrict Delete)──> task_completions
members        ──(1:N, Restrict Delete)──> event_participations
members        ──(1:N, Restrict Delete)──> points_ledger
members        ──(1:N, Restrict Delete)──> inventory_borrowings

attendance_sessions ──(1:N, Cascade Delete)──> volunteer_codes
attendance_sessions ──(1:N, Restrict Delete)──> attendance_records

tasks ──(1:N, Cascade Delete)──> task_completions
events ──(1:N, Cascade Delete)──> event_participations
inventory_items ──(1:N, Restrict Delete)──> inventory_borrowings

roles ──(1:N, Restrict Delete)──> users
roles ──(1:N, Cascade Delete)──> role_permissions
permissions ──(1:N, Cascade Delete)──> role_permissions
```

### Cascade Policy Guidelines
1. **Restrict Delete (Default):** Deleting a parent entity (e.g. `member`, `academic_year`, `inventory_item`) is restricted if child transactional records exist.
2. **Cascade Delete:** Internal junction tables (`role_permissions`) and non-transactional child items (`volunteer_codes`) delete automatically when the parent row is purged.
3. **Soft Delete Preservation:** Entities with `deleted_at` set are excluded from standard API queries while preserving all historical foreign key references.

---

# 4. Domain Ownership Matrix

| Entity | Domain Owner | Primary Accessing Services |
| :--- | :--- | :--- |
| `academic_years`, `semesters` | Academic / Settings Domain | `SettingsService`, `MemberService` |
| `users`, `roles`, `permissions`, `role_permissions` | Security / Administration Domain | `AuthService`, `RbacService`, `UserService` |
| `system_settings`, `audit_logs` | System / Audit Domain | `SettingsService`, `AuditService` |
| `members`, `memberships` | Identity / Members Domain | `MemberService`, `MembershipService`, `QrService` |
| `attendance_sessions`, `volunteer_codes`, `attendance_records` | Attendance Domain | `AttendanceService`, `VolunteerCodeService` |
| `tasks`, `task_completions`, `events`, `event_participations` | Activities Domain | `TaskService`, `EventService` |
| `points_ledger` | Points Ledger Domain | `PointsLedgerService`, `LeaderboardService` |
| `inventory_items`, `inventory_borrowings` | Inventory Domain | `InventoryService`, `BorrowingService` |

---

# 5. Entity Lifecycle Definitions

1. **Member Lifecycle:**  
   `Created` $\rightarrow$ `Active` $\rightarrow$ `Inactive` (End of academic period) $\rightarrow$ `Renewed / Active` (Membership renewal) $\rightarrow$ `Alumni` (Graduation) or `Suspended` (Admin action). Soft-deleted on removal.
2. **Attendance Session Lifecycle:**  
   `Draft` $\rightarrow$ `Scheduled` $\rightarrow$ `Active` $\leftrightarrow$ `Paused` $\rightarrow$ `Closed` $\rightarrow$ `Archived`.
3. **Task & Event Lifecycles:**  
   `Draft` $\rightarrow$ `Upcoming / Active` $\rightarrow$ `Completed` $\rightarrow$ `Archived`.
4. **Inventory Borrowing Lifecycle:**  
   `Available` $\rightarrow$ `Borrowed` $\rightarrow$ `Overdue` (If past return date) $\rightarrow$ `Returned` (With condition assessment: Good/Damaged/Lost).
5. **Volunteer Code Lifecycle:**  
   `Unused` $\rightarrow$ `Active` $\rightarrow$ `Expired` (Timer reached) or `Revoked` (Admin action).

---

# 6. Database Risk Assessment

1. **Transactional Ledger Integrity (Low Risk, High Priority):** Direct modification of total points stored on member rows leads to race conditions and audit loss.  
   *Mitigation:* Total points are never stored as a field; points are computed dynamically via $\sum (\text{points\_ledger})$ or cached read-only.
2. **Soft Delete FK Cascade Risk (Medium Risk):** Hard deletion of soft-deleted members could corrupt `attendance_records` or `points_ledger` history.  
   *Mitigation:* Foreign keys enforce `ON DELETE RESTRICT`. Hard deletes (`purge`) are restricted to Super Admins.
3. **Volunteer Code Race Condition (Low Risk):** Simultaneous scanning using expired volunteer codes.  
   *Mitigation:* Unique constraint on `volunteer_codes.code` and atomic validation transactions.

---

# END OF FILE
