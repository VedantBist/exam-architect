# Current Behavior Baseline (Freeze Point)

- Snapshot date: February 14, 2026
- Snapshot commit: `853d25e`
- Objective: preserve current user-visible behavior while replacing backend with Spring Boot.

## Scope

This baseline captures the behavior currently implemented by:

- `src/lib/auth.tsx`
- `src/lib/examStorage.ts`
- `src/pages/admin/*.tsx`
- `src/pages/student/*.tsx`
- `src/App.tsx`
- `src/components/ProtectedRoute.tsx`

## Route and Access Baseline

Public routes:

- `/` -> landing page
- `/auth` -> auth page

Protected routes:

- `/dashboard` -> any logged-in role
- `/dashboard/exams` -> admin only
- `/dashboard/exams/create` -> admin only
- `/dashboard/results` -> admin only
- `/dashboard/my-exams` -> student only
- `/dashboard/my-results` -> student only
- `/exam/:examId` -> student only

Guard behavior:

- unauthenticated user is redirected to `/auth`
- wrong role is redirected to `/dashboard`

## Authentication Baseline

Source of truth:

- in-memory user map for credentials
- current session in `localStorage` key `dummyAuth`

Default users:

- admin: `admin@example.com` / `admin123` / id `admin-001`
- student: `student@example.com` / `student123` / id `student-001`

Behavior:

- login simulates about 500ms delay
- signup validates:
  - unique email in in-memory map
  - password length >= 6
  - role is `admin` or `student`
- signup auto-logs in
- signout removes `dummyAuth`

## Data Baseline (Local Storage)

Keys:

- `exams_storage`
- `attempts_storage`

Exam shape:

```json
{
  "id": "exam-001",
  "title": "Physics Test",
  "description": "Basic Physics Concepts and Problems",
  "durationMinutes": 60,
  "passingPercentage": 40,
  "createdBy": "admin-001",
  "status": "active",
  "questions": [
    {
      "id": "q1",
      "text": "Question text",
      "type": "mcq",
      "marks": 1,
      "orderIndex": 0,
      "options": [{ "id": "opt1", "text": "m/s", "isCorrect": true }],
      "correctAnswer": "m/s"
    }
  ],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

Attempt shape:

```json
{
  "id": "attempt-xxx",
  "examId": "exam-001",
  "studentId": "student-001",
  "studentName": "Student User",
  "answers": {
    "q1": "m/s",
    "q2": true,
    "q3": "20"
  },
  "score": 2,
  "totalMarks": 3,
  "percentage": 66.6667,
  "status": "in-progress",
  "startedAt": "ISO-8601",
  "submittedAt": "ISO-8601 or omitted"
}
```

## Functional Baseline

Admin:

- can create exam with question types `mcq`, `true_false`, `integer`
- newly created exam status is `created`
- can delete exam
- manage page currently shows all exams in storage

Student:

- sees only exams with status `active`
- exam card shows:
  - title/description
  - duration minutes
  - passing percentage
  - attempt status (`In Progress` or `Completed`)
- action label rules:
  - no attempt + active -> `Start Exam`
  - in-progress attempt -> `Resume`
  - submitted attempt -> `Completed` (disabled)

Take exam:

- if exam not found -> toast + redirect `/dashboard/my-exams`
- if exam not active -> toast + redirect `/dashboard/my-exams`
- if attempt already submitted -> toast + redirect `/dashboard/my-results`
- if no attempt -> create new attempt
- countdown = `startedAt + durationMinutes - now`
- auto-submit when timer reaches 0
- manual submit available from last question

Scoring rules:

- `mcq`: correct when saved answer string equals `question.correctAnswer`
- `true_false`: correct when saved boolean equals `question.correctAnswer`
- `integer`: correct when `Number(answer) === question.correctAnswer`
- score is sum of `marks` for correct answers
- percentage = `score / totalMarks * 100`

Results:

- only attempts with `status === "submitted"` are shown
- pass when `percentage >= passingPercentage`
- sorted latest first by `submittedAt`

Dashboard stats:

- totalExams = count of exams
- activeExams = exams where status `active`
- totalAttempts = attempts count
- submittedAttempts = attempts where status `submitted`

## As-Is Compatibility Notes (Must Be Deliberate)

- Status strings use hyphen style (`in-progress`), not snake_case.
- Frontend data model is camelCase (`durationMinutes`, not `duration_minutes`).
- Attempt uniqueness is effectively one per student per exam in UI flow.
- Current timer is computed on client from `startedAt`; no server heartbeat exists.
- If exact parity is required, these conventions must remain unchanged at API boundary.

