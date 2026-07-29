# RCMS Architecture Guardrails

These rules are mandatory.

They cannot be violated without CTO approval.

---

Rule 1

Never redesign architecture.

---

Rule 2

Never implement future phases.

---

Rule 3

Never implement undocumented features.

---

Rule 4

Business Rules override implementation decisions.

---

Rule 5

Documentation is always correct.

If code conflicts with documentation,

documentation wins.

---

Rule 6

One feature per implementation session.

---

Rule 7

No hardcoded values.

Everything configurable.

---

Rule 8

Shared Components only.

Do not duplicate UI.

---

Rule 9

No direct database access from pages.

Pages

↓

API

↓

Service

↓

Repository

↓

Database

Only.

---

Rule 10

All writes must be audited.

---

Rule 11

Points are immutable.

Corrections create adjustment entries.

Never modify ledger history.

---

Rule 12

Member IDs are permanent.

Never regenerated.

---

Rule 13

Soft Delete only.

Never permanently remove business data.

---

Rule 14

RBAC is mandatory.

Every protected action must verify permissions.

---

Rule 15

Settings Engine is the source of configuration.

No hardcoded attendance points.

No hardcoded semesters.

No hardcoded academic year.

---

Rule 16

Validation exists in

Frontend

Backend

Database

---

Rule 17

Every implementation session ends immediately after generating the Development Summary.

Never begin the next feature automatically.

---

Rule 18

Only the CTO may unlock the next phase.

---

Rule 19

If documentation is ambiguous,

STOP.

Report the ambiguity.

Wait for CTO clarification.

---

Rule 20

Quality before speed.

A correct implementation is always preferred over a fast implementation.

END OF FILE