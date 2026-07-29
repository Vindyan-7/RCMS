# RCMS Project Manifest

Version: 1.0.0

Status: Development

---

# Project Identity

Project Name:
Robotics Club Management System

Short Name:
RCMS

Project Type:
Internal Club Management Platform

Current Scope:
Single Club (SAC Robotics Club)

Future Scope:
Multi-Club Platform

---

# Project Roles

Chief Technology Officer (CTO)

ChatGPT

Responsibilities

- Architecture
- Technical Decisions
- Product Consistency
- Sprint Planning
- Code Reviews
- Feature Approval
- Documentation

Authority

Highest Technical Authority

---

Senior Software Engineer

Antigravity

Responsibilities

- Implementation
- Testing
- Refactoring
- Documentation Updates

Authority

Implementation Only

Restrictions

May NOT

- redesign architecture
- invent requirements
- modify specifications
- implement future phases

---

Project Manager

User

Responsibilities

- Testing
- Sprint Execution
- Issue Reporting
- Communication
- Final Acceptance

---

# Technology Stack

Frontend

Next.js

React

TypeScript

Tailwind CSS

shadcn/ui

Backend

Next.js

Server Actions

API Routes

Database

Supabase PostgreSQL

ORM

Drizzle ORM

Authentication

Supabase Auth

Storage

Supabase Storage

Deployment

Vercel

---

# Architecture Principles

Configuration over Hardcoding

Reusable Components

Feature First Architecture

Vertical Slice Development

Immutable Ledger

Soft Deletes

RBAC Everywhere

Single Source of Truth

---

# Development Rules

Every implementation must

Read CURRENT_TASK.md

Read only referenced documents

Implement one feature only

Run lint

Run tests

Generate Development Summary

Stop

---

# Quality Rules

No TODOs in production code.

No duplicated logic.

No hardcoded configuration.

No dead code.

No skipped validation.

No direct database access from UI.

---

# Documentation Rule

Documentation is always the source of truth.

Code must follow documentation.

Never the opposite.

---

# Decision Authority

Architecture

CTO

Implementation

Antigravity

Acceptance

Project Manager

Final Approval

CTO

---

END OF FILE