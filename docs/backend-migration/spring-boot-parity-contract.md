# Spring Boot Parity Contract (UI-Preserving)

## Goal

Replace localStorage backend logic with Spring Boot while keeping:

- same routes
- same UI behavior
- same field names and enum strings at frontend boundary

No UI component rewrite is required for this contract.

## Compatibility Rules (Non-Negotiable)

1. JSON remains camelCase (example: `durationMinutes`, `passingPercentage`).
2. Attempt status values remain `in-progress` and `submitted`.
3. Question type values remain `mcq`, `true_false`, `integer`.
4. Scoring logic remains identical to current implementation.
5. Error payload format is stable and machine-readable.

## Canonical DTOs

ExamOption:

```json
{ "id": "opt-1", "text": "m/s", "isCorrect": true }
```

ExamQuestion:

```json
{
  "id": "q1",
  "text": "What is ...?",
  "type": "mcq",
  "marks": 1,
  "orderIndex": 0,
  "options": [{ "id": "opt-1", "text": "A", "isCorrect": false }],
  "correctAnswer": "A"
}
```

Exam:

```json
{
  "id": "exam-001",
  "title": "Physics Test",
  "description": "Basic Physics Concepts and Problems",
  "durationMinutes": 60,
  "passingPercentage": 40,
  "createdBy": "admin-001",
  "status": "active",
  "questions": [],
  "createdAt": "2026-02-14T00:00:00.000Z",
  "updatedAt": "2026-02-14T00:00:00.000Z"
}
```

StudentAttempt:

```json
{
  "id": "attempt-001",
  "examId": "exam-001",
  "studentId": "student-001",
  "studentName": "Student User",
  "answers": { "q1": "m/s", "q2": true, "q3": "20" },
  "score": 0,
  "totalMarks": 5,
  "percentage": 0,
  "status": "in-progress",
  "startedAt": "2026-02-14T10:00:00.000Z",
  "submittedAt": null
}
```

AuthUser:

```json
{
  "id": "student-001",
  "email": "student@example.com",
  "fullName": "Student User",
  "role": "student"
}
```

## API Surface (Proposed)

Base path: `/api/v1`

Auth:

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/logout`
- `GET /auth/me`

Exams:

- `GET /exams`
- `GET /exams/{examId}`
- `POST /exams`
- `PATCH /exams/{examId}`
- `DELETE /exams/{examId}`

Attempts:

- `GET /attempts?studentId={id}`
- `GET /attempts/exam/{examId}?studentId={id}`
- `POST /attempts` (create attempt)
- `PATCH /attempts/{attemptId}` (update answers or fields)
- `POST /attempts/{attemptId}/submit` (server-side scoring + submit)

Stats:

- `GET /stats/exams`

## Business Rules to Preserve

1. Student can only start active exam.
2. Submitted attempt cannot return to in-progress.
3. One active attempt per `(examId, studentId)`.
4. On submit, compute:
   - `score`
   - `percentage`
   - `status = submitted`
   - `submittedAt = now`
5. Integer grading uses numeric comparison with current behavior equivalent to:
   - `Number(answer) === correctAnswer`
6. True/false grading uses boolean equality.
7. MCQ grading uses stored option text equality with `correctAnswer` string.

## Error Contract

Every non-2xx response should return:

```json
{
  "code": "EXAM_NOT_ACTIVE",
  "message": "This exam is not currently active",
  "details": null
}
```

Minimum codes:

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_EMAIL_EXISTS`
- `AUTH_UNAUTHORIZED`
- `AUTH_FORBIDDEN`
- `EXAM_NOT_FOUND`
- `EXAM_NOT_ACTIVE`
- `ATTEMPT_NOT_FOUND`
- `ATTEMPT_ALREADY_SUBMITTED`
- `VALIDATION_ERROR`

## Security Contract

Recommended:

- Spring Security + JWT (access + refresh) or secure session cookies
- enforce role checks server-side:
  - admin: exam create/update/delete
  - student: attempt create/update/submit, exam read (active only unless policy changed)

## Frontend Integration Strategy

Keep existing UI and function signatures by replacing internals of:

- `signIn`, `signUp`, `signOut` in `src/lib/auth.tsx`
- storage functions in `src/lib/examStorage.ts`

Do not change callers in pages; return the same shapes they use today.

## Header Contract

- All authenticated API routes require `X-User-Id`.
- Backend enforces role-safe operations:
  - admin: exam create/update/delete
  - student: own attempt create/read/update/submit only

## Contract Verification (Before Cutover)

1. `Start Exam` for active exam succeeds.
2. Non-active exam shows same toast behavior.
3. Resume in-progress attempt works.
4. Timer expiry auto-submits.
5. Result values (score/percentage/pass) match local implementation for same answers.
6. Dashboard and list counts remain unchanged for same dataset.
