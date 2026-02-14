# Cutover Runbook (Spring Boot Backend)

## Goal

Deploy Spring Boot backend with verifiable parity, keep frontend UI unchanged, and preserve fast rollback.

## Preconditions

- Docker Desktop is running.
- `curl` and `jq` are installed.
- Frontend build is already parity-validated in API mode.

## Staging Deploy

From repo root:

```bash
./backend/scripts/deploy-cutover.sh staging
```

What this does:

- Deploys staging stack via `backend/deploy/docker-compose.staging.yml`
- Waits for `/api/v1/health`
- Runs parity smoke checks
- Runs synthetic monitoring checks for auth/submission/latency

## Production Deploy

From repo root:

```bash
CONFIRM_PRODUCTION=YES ./backend/scripts/deploy-cutover.sh production
```

## Monitoring During Cutover

Run continuously or on schedule:

```bash
BASE_URL=http://localhost:8081/api/v1 SAMPLES=10 ./backend/scripts/cutover-monitor.sh
```

Threshold env vars:

- `MAX_AUTH_ERRORS` (default `0`)
- `MAX_SUBMISSION_ERRORS` (default `0`)
- `MAX_P95_LATENCY_MS` (default `1200`)

## Frontend Rollback Toggle

Switch frontend to local fallback mode:

```bash
./scripts/set-backend-mode.sh local
```

Switch frontend back to Spring Boot API mode:

```bash
./scripts/set-backend-mode.sh api
```

After changing mode, rebuild/redeploy frontend artifact.

## Stack Shutdown

```bash
./backend/scripts/deploy-cutover.sh staging down
./backend/scripts/deploy-cutover.sh production down
```
