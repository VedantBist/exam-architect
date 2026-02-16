About This Project

Purpose

This document explains the Exam Architect project from A to Z in plain English so a beginner can understand what the project is, how it is structured, how it runs in development and production, and how to make future changes. Read this file to get a complete mental model of the repository and to know where to change things when new features are requested.

High level summary

- What it is: Exam Architect is a web application that supports creating, administering, and taking exams. It has a frontend user interface and a backend service, plus integration components for authentication and data storage.
- Who uses it: Students, instructors, and administrators. Students take exams. Instructors create and manage exam content. Admins configure global settings.
- Primary goals: Provide a secure, test-taking experience, allow exam creation and grading, support user accounts and basic analytics.

Zero-cost AI mode (important)

- The AI assistant supports a fallback mode that does not call paid external APIs.
- Current default backend setting is `OPENAI_ENABLED=false`, which keeps usage at zero dollars.
- Paid OpenAI usage happens only if someone explicitly sets:
  - `OPENAI_ENABLED=true`
  - `OPENAI_API_KEY=<real key>`

Repository layout and where to look first

The repository contains two main parts: a frontend single page application (SPA) and a backend server.

Top-level folders and files to know:

- /src: Frontend application source code. This is a React + TypeScript app built with Vite. Look here for UI components and pages.
- /backend: Java Spring Boot backend service. It contains controllers, services, and configuration for the server.
- /public: Static assets served by the frontend.
- /docs: Project documentation and migration runbooks.
- package.json: Frontend project manifest with scripts and dependencies.
- vite.config.ts: Frontend build and dev server configuration.
- pom.xml: Backend Maven configuration (build, dependencies).
- docker-compose.yml and backend/deploy files: Container and deployment definitions for local and production deployments.
- supabase/: Supabase migration files and configuration.

If you need to find a specific feature quickly, search for the UI page in `/src/pages` or the corresponding backend controller in `/backend/src/main/java`.

Tech stack overview

- Frontend: React, TypeScript, Vite, Tailwind CSS. The UI code is component-based and organized under `components` and `pages`.
- Backend: Java, Spring Boot, Maven. Typical layers: controllers, services, repositories.
- Database: The repo integrates migrations for a SQL database (check `supabase/migrations` and backend configuration). The backend likely uses a relational database with migrations stored in the repo.
- Auth and integration: Supabase appears used for some parts of authentication or data; also the frontend has `lib/backendClient.ts` and `integrations/supabase` which handle communication.
- Containerization: Docker and docker-compose are used to run services locally and in staging/production.
- Testing: Frontend uses Vitest. Backend includes JUnit tests in the `backend/src/test` and generated surefire reports in `target/surefire-reports`.

High-level architecture

1. User (browser) interacts with the frontend SPA.
2. Frontend calls backend REST APIs for actions like login, fetching exams, submitting answers, and viewing results.
3. Backend handles business logic: authentication, exam management, attempt scoring, persistence, and any background tasks.
4. Database persists users, exams, attempts, and results.
5. Optional integrations (Supabase, external services) handle auth, file storage, or other extras.
6. CI builds and tests both frontend and backend; deployments create containers from built artifacts.

Frontend structure and flow

- Entry point: `src/main.tsx` boots the React app and mounts the root component.
- Routing: The app uses client-side routes. Check `src/pages` for route components like `Auth.tsx`, `Dashboard.tsx`, and `pages/admin` / `pages/student`.
- Components: Reusable UI components live in `src/components` and `src/components/layout`, `src/components/ui` folders. These include navigation, protected routes, and small controls.
- State and helpers: `lib/` contains helpers like `backendClient.ts`, `auth.tsx`, `examStorage.ts`, and `utils.ts` used across the app.
- Data flow: Pages request data from `backendClient` and display results. Forms send data back to backend endpoints.

Backend structure and flow

- Entry point: The Spring Boot application class is in `backend/src/main/java` (search for the class annotated with `@SpringBootApplication`).
- Controllers: REST endpoints are implemented in controller classes. Each functional area (auth, exam, attempt) has a controller.
- Services: Business rules live in service classes. Services call repositories and perform validation and scoring logic.
- Repositories and persistence: Database access happens via repository classes or ORM mappings. Migrations are used to evolve the database schema.
- Tests: Unit and integration tests are present in the `backend/src/test` folder. Look at generated surefire reports for test outputs.

Common developer workflows

1. Setup local environment
- Frontend: Install node dependencies and run the dev server. Typical commands (adjust for your environment): `npm install` then `npm run dev`.
- Backend: Build with Maven: `mvn -f backend/pom.xml spring-boot:run` or `mvn -f backend/pom.xml package` and run the jar.
- Database: Run the database as defined in `docker-compose.yml` or use a managed database and point the backend config to it.

2. Running tests
- Frontend unit tests: run `npm test` or `npm run test` (see `package.json` scripts).
- Backend tests: run `mvn -f backend/pom.xml test`.

3. Debugging locally
- Frontend: Use the browser devtools and Vite dev server. The TypeScript source maps allow stepping through code.
- Backend: Run the Spring Boot app from your IDE or with Maven and attach a debugger.

How features map to code locations (examples)

- Add a new page for admins: Create a file in `src/pages/admin`, add a route in the routing config, and create any new components in `src/components`.
- Add an API for exam creation: Add a new endpoint in `backend/src/main/java/.../controller/ExamController.java`, add business logic to `service/ExamService`, and add repository changes if schema changes are needed.
- Change scoring logic: Modify the scoring logic in the attempt-related service (look for classes named with AttemptService or Scoring) and update corresponding unit tests.

Deployment and environment details

- Docker and docker-compose: There are compose files for local development and for staging/production. Use `docker-compose.yml` to run the stack locally, and `backend/deploy/docker-compose.production.yml` or `backend/deploy/docker-compose.staging.yml` for remote environments.
- Environment variables: Backend and frontend read configuration from environment variables. Check `backend/src/main/resources/application.yml` or `target/classes/application.yml` for known keys.
- CI/CD: The repo contains build configuration and scripts in `backend/scripts` and other CI config files. The exact CI provider is not specified in this file; look at repository settings or pipeline files in the project root.

Security and auth

- Authentication: The repo includes an `integrations/supabase` folder and `lib/auth.tsx`, indicating the frontend uses a token-based auth mechanism and possibly Supabase auth. The backend will validate tokens and protect endpoints via Spring security or custom filters.
- Common security practices to keep in mind:
  - Always validate and sanitize input on the server.
  - Keep secrets out of the repository. Use environment variables or secret managers for production.
  - Limit CORS to trusted origins in production.

Testing and quality

- Unit tests cover both frontend and backend logic. Frontend uses Vitest; backend uses JUnit.
- There are surefire test reports in `backend/target/surefire-reports` that can be reviewed when CI fails.
- For UI testing, consider adding end-to-end tests with Playwright or Cypress if they are not present.

Common maintenance tasks and where to implement them

- Add a database column: Create a new migration in `supabase/migrations` or the backend migrations folder, update the JPA entity or repository, and update any affected services and tests.
- Modify UI style: Update Tailwind config (`tailwind.config.ts`) or component classes in `src/components`.
- Add an API: Add controller, service, repository, DTO classes, and update API client usage in `lib/backendClient.ts`.

How to make a typical change (step by step example)

Example: Add a new field to exam metadata and expose it in the UI.
1. Create a database migration that adds the new column. Place the migration in `supabase/migrations` with a clear name.
2. Update the backend entity class to include the new field and add mapping annotations if needed.
3. Update backend DTOs and controller to include the field in responses and requests.
4. Add or update unit tests in `backend/src/test` to validate the new field behaves correctly.
5. Update frontend types in `lib/authTypes.ts` or other type files to include the new field.
6. Update API client calls in `lib/backendClient.ts` if the response shape changed.
7. Update UI components or pages in `src/pages` or `src/components` to display or edit the new field.
8. Run frontend and backend tests and manual verification.

Checklist before merging changes to main branch

- All unit tests pass locally.
- Linting and formatting checks are satisfied.
- Integration tests or smoke tests run successfully against a staging environment.
- Database migrations are present and reviewed.
- Documentation updated for any breaking API or schema changes.

Performance and scaling notes

- The backend should consider pagination on read endpoints returning large lists (exams, attempts).
- Cache frequently read but rarely changed data if response times are critical.
- For high concurrency during exams, ensure the database and server can handle burst traffic and that long-running scoring does not block request handling.

Future improvements and recommended next steps

- Add end-to-end tests to cover main user journeys (login, take exam, submit, review results).
- Add a staged CI pipeline that builds frontend and backend artifacts and runs automated smoke tests against a disposable environment.
- Add feature flags to roll out large changes gradually.
- Improve monitoring and observability for production: logs, metrics, and alerts.

Glossary of common terms used in this project

- Exam: A set of questions presented to a student to assess knowledge.
- Attempt: One student taking an exam; includes answers and timestamps.
- Scoring: The process of computing a numeric score from answers.
- DTO: Data transfer object, used to move structured data between frontend and backend.

Where to look for help

- Code: Look in `src` for frontend work and `backend/src/main/java` for backend.
- Documentation: Check `README.md`, `SETUP_COMPLETE.md`, and `docs/` for runbooks and migration notes.
- Tests: Run frontend tests with the command in `package.json` and backend tests with Maven.

Closing notes

This file is intended to be the first document a new developer reads. It maps features to code locations and gives pragmatic steps for the most common tasks. If you need a walkthrough for a specific change, or want the document expanded with command examples and exact file references for every component, tell me which area you want next and I will update this file.
