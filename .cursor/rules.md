# Cursor Rules – Universal Full Stack (FastAPI / React / Supabase)

This repository prioritizes correctness, consistency, and predictable execution.

Architecture and large structural decisions originate from Cursor Plan Mode (GPT-5.2).

All coding models must follow the rules below.

---

# =========================
# Core Operating Principles
# =========================

## Planning Authority
- Plans generated in Cursor Plan Mode (GPT-5.2) are authoritative.
- Folder structure, architecture, and large refactors must originate from Plan Mode.

---

## Execution Discipline
- Follow approved plans exactly.
- Execute steps in order.
- Do not reinterpret, redesign, or optimize beyond the plan.
- If something is ambiguous or risky, stop and ask.

---

## Change Scope
- Prefer minimal, intentional changes.
- Do not refactor unrelated code.
- Preserve existing behavior unless explicitly instructed.
- Avoid “cleanup” or stylistic changes unless requested.

---

## Safety First
- Do not delete files unless explicitly instructed.
- When moving files, update all imports and references.
- Avoid breaking public APIs or shared contracts.

---

## Dependencies
- Do not introduce new libraries or frameworks unless explicitly instructed.
- Prefer existing utilities and patterns.

---

## Communication
- After changes, summarize what was modified.
- Flag risks, follow-ups, or TODOs introduced.

---

# =========================
# Backend Rules (FastAPI)
# =========================

Applies when editing backend code.

## Architecture
- Respect existing FastAPI structure (routers, services, dependencies).
- Keep routing, validation, and business logic separated.
- Do not reorganize routers unless instructed.

---

## FastAPI Conventions
- Use dependency injection (`Depends`) consistently.
- Prefer explicit Pydantic request/response models.
- Maintain consistent status codes and error handling.
- Avoid returning raw dicts if schemas exist.

---

## Supabase & Database
- Supabase is the source of truth for auth and Postgres data.
- Do not modify schema assumptions unless explicitly instructed.
- Avoid destructive queries or migrations unless included in the plan.
- Use parameterized queries and existing DB helpers.

---

## Auth & Security
- Do not weaken auth, RLS, or permission checks.
- Never log secrets, tokens, or PII.
- Ask before touching auth behavior if unclear.

---

## Async & Performance
- Maintain async/await consistency.
- Avoid blocking I/O in async routes.
- Do not optimize prematurely unless instructed.

---

# =========================
# Frontend Rules (React)
# =========================

Applies when editing frontend code.

## Components
- Respect existing component boundaries.
- Do not merge or split components unless instructed.
- Keep components focused and readable.

---

## State Management
- Use existing patterns (hooks, context, stores).
- Do not introduce new state libraries unless instructed.
- Avoid duplicating state.

---

## API Integration
- Do not change API contracts unless instructed.
- Match request/response shapes exactly.
- Handle loading and error states consistently.

---

## Styling & UI
- Match existing styling conventions.
- Do not introduce new styling systems.
- Avoid visual changes unless explicitly requested.

---

# =========================
# Large Changes & Agent Execution
# =========================

Applies when performing:
- Repo-wide changes
- Multi-file refactors
- Terminal-based code modifications

## Execution Mode
- Treat changes as production-impacting.
- Favor correctness and reversibility over speed.
- Do not guess intent; ask if unclear.

Large changes should be boring, predictable, and safe.
