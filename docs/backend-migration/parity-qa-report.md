# Parity QA Report

- Date: February 14, 2026
- Scope: Phase 6/7 verification for Spring Boot migration and cutover readiness

## Automated Checks Executed

- Frontend unit tests: `npm test -- --run` -> passed
  - includes timer auto-submit parity coverage: `src/pages/student/TakeExam.test.tsx`
- Frontend production build: `npm run build` -> passed
- Backend Maven tests: `cd backend && mvn -Dmaven.repo.local=.m2/repository test` -> passed
  - result summary: 14 tests, 0 failures, 0 errors, 1 skipped
  - skipped: `ExamArchitectBackendApplicationTests` (disabled by design unless live DB integration is explicitly desired)
- Backend smoke flow (runtime): `BASE_URL=http://localhost:8080/api/v1 ./backend/scripts/parity-smoke.sh` -> passed
  - validates: health, auth login/me, admin create/delete exam, attempt create/update/submit, stats, cleanup
- Staging cutover deploy: `./backend/scripts/deploy-cutover.sh staging` -> passed
  - includes deploy, health gate, parity smoke, cutover monitor
- Production-profile cutover deploy: `CONFIRM_PRODUCTION=YES ./backend/scripts/deploy-cutover.sh production` -> passed
  - includes deploy, health gate, parity smoke, cutover monitor
  - rollback toggle validated via `./scripts/set-backend-mode.sh local|api`

## Backend Coverage Added

- Web MVC contract tests:
  - `backend/src/test/java/com/examarchitect/backend/auth/controller/AuthControllerWebMvcTest.java`
  - `backend/src/test/java/com/examarchitect/backend/exam/controller/ExamControllerWebMvcTest.java`
  - `backend/src/test/java/com/examarchitect/backend/attempt/controller/AttemptControllerWebMvcTest.java`
- Attempt scoring parity unit tests:
  - `backend/src/test/java/com/examarchitect/backend/attempt/service/AttemptServiceScoringTest.java`

## Contract/Parity Hardening Completed

- Added OpenAPI contract at `backend/src/main/resources/static/openapi.yaml`
- Enforced backend role/access checks with `X-User-Id`:
  - admin-only exam create/update/delete
  - student-only own-attempt read/update/submit
- Added idempotent client submit guard in `src/pages/student/TakeExam.tsx` to prevent duplicate auto-submit race paths
- Added cutover automation artifacts:
  - `backend/scripts/deploy-cutover.sh`
  - `backend/scripts/cutover-monitor.sh`
  - `backend/deploy/docker-compose.staging.yml`
  - `backend/deploy/docker-compose.production.yml`

## Conclusion

- Phase 6 parity QA: complete
- Phase 7 cutover verification: complete
- Exit criteria: satisfied
