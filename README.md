# Exam Architect

Exam Architect is an online exam platform with role-based auth, admin exam management, student exam taking, scoring, results, and dashboard stats.

The app supports two backend modes:

- `local`: browser storage fallback
- `api`: Spring Boot + PostgreSQL (`backend/`)

## Zero-Cost AI Safety (Default)

- OpenAI API usage is disabled by default.
- The assistant runs in fallback mode without paid external API calls.
- Default backend config: `OPENAI_ENABLED=false`.

Only if you explicitly enable these values will paid API calls be possible:

```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=your_key_here
```

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind + shadcn-ui
- Backend: Spring Boot 3 + JPA + Flyway + PostgreSQL
- Tests: Vitest (frontend), JUnit/MockMvc (backend)

## Prerequisites

- Node.js 18+
- npm
- Java 21+
- Maven 3.9+
- Docker Desktop (for PostgreSQL via Compose)

## Setup

```bash
git clone https://github.com/VedantBist/exam-architect.git
cd exam-architect
npm install
```

## Start (Local Mode)

This mode requires only frontend.

```bash
npm run dev
```

Open `http://localhost:5173`.

## Start (Spring Boot API Mode)

1. Start PostgreSQL:

```bash
docker compose -f backend/docker-compose.yml up -d
```

2. Start backend:

```bash
cd backend
mvn spring-boot:run
```

3. In project root, set frontend to API mode (new terminal):

```bash
./scripts/set-backend-mode.sh api
```

4. Start frontend:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Demo Users

- Admin: `admin@example.com` / `admin123`
- Student: `student@example.com` / `student123`

## Stop The App

- Stop frontend/backend processes: `Ctrl + C` in their terminals
- Stop local PostgreSQL:

```bash
docker compose -f backend/docker-compose.yml down
```

- If staging/production compose profiles were used:

```bash
./backend/scripts/deploy-cutover.sh staging down
./backend/scripts/deploy-cutover.sh production down
```

## Useful Commands

```bash
npm test -- --run
npm run build
cd backend && mvn -Dmaven.repo.local=.m2/repository test
BASE_URL=http://localhost:8080/api/v1 ./backend/scripts/parity-smoke.sh
```

Switch frontend back to local mode:

```bash
./scripts/set-backend-mode.sh local
```

## Safe Billing Checklist

- Keep `OPENAI_ENABLED=false` for zero-dollar usage.
- Do not set `OPENAI_API_KEY` in env files.
- If you ever enable OpenAI later, set strict usage limits in your OpenAI billing dashboard first.

## Documentation

- [Backend README](./backend/README.md)
- [Migration Checklist](./docs/backend-migration/migration-checklist.md)
- [Cutover Runbook](./docs/backend-migration/cutover-runbook.md)
- [Parity QA Report](./docs/backend-migration/parity-qa-report.md)

## License

MIT
