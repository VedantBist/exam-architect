CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    passing_percentage INT NOT NULL CHECK (passing_percentage >= 0 AND passing_percentage <= 100),
    created_by VARCHAR(128) NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('created', 'active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(128) PRIMARY KEY,
    exam_id VARCHAR(128) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('mcq', 'true_false', 'integer')),
    marks INT NOT NULL CHECK (marks > 0),
    order_index INT NOT NULL,
    correct_answer_text TEXT,
    correct_answer_bool BOOLEAN,
    correct_answer_number NUMERIC(20, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
    id VARCHAR(128) PRIMARY KEY,
    question_id VARCHAR(128) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id VARCHAR(128) PRIMARY KEY,
    exam_id VARCHAR(128) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id VARCHAR(128) NOT NULL REFERENCES users(id),
    student_name VARCHAR(255) NOT NULL,
    answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    score INT NOT NULL DEFAULT 0,
    total_marks INT NOT NULL DEFAULT 0,
    percentage NUMERIC(7, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('in-progress', 'submitted')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON exam_attempts(exam_id);
