# Backend Migration Checklist (Spring Boot)

## Phase 1: Baseline Freeze

- [x] Tag current frontend behavior snapshot commit.
- [x] Review and approve `baseline-current-behavior.md`.
- [x] Confirm parity scope:
  - [x] exact UI
  - [x] exact field names
  - [x] exact scoring and timer behavior

## Phase 2: Contract Finalization

- [x] Review and approve `spring-boot-parity-contract.md`.
- [x] Finalize enum/value conventions:
  - [x] exam status (`created`, `active`, `archived`)
  - [x] attempt status (`in-progress`, `submitted`)
  - [x] question type (`mcq`, `true_false`, `integer`)
- [x] Freeze error code list and response format.

## Phase 3: Spring Boot Foundation

- [x] Create Spring Boot project modules:
  - [x] auth
  - [x] exams/questions
  - [x] attempts/results
  - [x] stats
- [x] Configure PostgreSQL schema matching contract.
- [x] Add migration scripts (Flyway or Liquibase).
- [x] Add seed data for demo admin/student and sample exams.

## Phase 4: API Build (Contract-First)

- [x] Implement auth endpoints.
- [x] Implement exam CRUD endpoints.
- [x] Implement attempt lifecycle endpoints.
- [x] Implement submit endpoint with scoring parity.
- [x] Implement stats endpoint.
- [x] Add OpenAPI spec and request/response validation tests.

## Phase 5: Frontend Adapter Switch

- [x] Replace internal implementation in `auth.tsx` with API calls.
- [x] Replace internal implementation in `examStorage.ts` with API calls.
- [x] Keep exported function signatures unchanged.
- [x] Add env flag for backend URL and migration mode.

## Phase 6: Parity QA

- [x] Login/logout flows match baseline.
- [x] Role protections match baseline.
- [x] Admin create exam flow matches baseline.
- [x] Student start/resume/submit flow matches baseline.
- [x] Timer + auto-submit behavior matches baseline.
- [x] Results scoring matches baseline for fixed test dataset.
- [x] Dashboard/list counts match baseline.

## Phase 7: Cutover

- [x] Deploy Spring Boot backend to staging.
- [x] Run full smoke test.
- [x] Deploy production with rollback toggle.
- [x] Monitor auth errors, submission errors, and latency.

## Exit Criteria

- [x] All parity scenarios pass.
- [x] No UI regressions reported in UAT.
- [x] LocalStorage backend path can be retired safely.

## Notes

- Baseline snapshot tag: `baseline-frontend-snapshot-2026-02-14` (points to commit `853d25e`).
- Timer parity is now covered by `src/pages/student/TakeExam.test.tsx`.
- Cutover scripts and runbook:
  - `backend/scripts/deploy-cutover.sh`
  - `backend/scripts/cutover-monitor.sh`
  - `docs/backend-migration/cutover-runbook.md`
