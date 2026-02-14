# Exam Architect Backend (Spring Boot)

This module is the Spring Boot foundation for migrating backend functionality while preserving current frontend behavior.

## What is included in this phase

- Spring Boot project scaffold
- PostgreSQL + JPA configuration
- Flyway migrations for schema and demo seed data
- Package structure for:
  - auth
  - exams/questions
  - attempts/results
  - stats
- Contract-aligned DTO scaffolding and baseline endpoints

## Run locally

1. Start PostgreSQL (example):

```bash
docker compose -f backend/docker-compose.yml up -d
```

2. Run backend:

```bash
cd backend
mvn spring-boot:run
```

3. API contract:

- OpenAPI spec: `backend/src/main/resources/static/openapi.yaml`
- When backend is running, spec is available at:
  - `http://localhost:8080/openapi.yaml`

## Default local config

- App port: `8080`
- DB: `jdbc:postgresql://localhost:5432/exam_architect`
- Username: `exam_user`
- Password: `exam_password`

## Current phase status

- Phase 4 implementation complete (auth/exams/attempts/stats APIs + OpenAPI + validation tests in codebase)
- Phase 5 adapter integration complete in frontend
- Phase 6 parity QA complete (including timer auto-submit verification)
- Phase 7 cutover tooling complete (staging/prod deploy + smoke + monitor + rollback toggle)

## Parity Smoke Check

After backend is running, execute:

```bash
BASE_URL=http://localhost:8080/api/v1 ./backend/scripts/parity-smoke.sh
```

Requirements:

- `curl`
- `jq`

## Deployment and Cutover

Deploy staging (includes health wait, smoke, and monitoring checks):

```bash
./backend/scripts/deploy-cutover.sh staging
```

Deploy production:

```bash
CONFIRM_PRODUCTION=YES ./backend/scripts/deploy-cutover.sh production
```

Monitor auth/submission errors and latency:

```bash
BASE_URL=http://localhost:8081/api/v1 SAMPLES=10 ./backend/scripts/cutover-monitor.sh
```

Rollback toggle (frontend back to local mode):

```bash
./scripts/set-backend-mode.sh local
```

## Access Header

All authenticated routes require `X-User-Id`:

- admin-only: `POST/PATCH/DELETE /api/v1/exams`
- student-only own records: `/api/v1/attempts*`

## Backend Tests

Run from `backend/`:

```bash
mvn -Dmaven.repo.local=.m2/repository test
```
