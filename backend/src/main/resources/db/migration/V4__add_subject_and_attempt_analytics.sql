ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS subject VARCHAR(64) NOT NULL DEFAULT 'General';

ALTER TABLE exam_attempts
    ADD COLUMN IF NOT EXISTS analytics_json JSONB NOT NULL DEFAULT '{"questionTimingMs":{}}'::jsonb;

UPDATE exam_attempts
SET analytics_json = '{"questionTimingMs":{}}'::jsonb
WHERE analytics_json IS NULL;

UPDATE questions
SET subject = 'Physics'
WHERE exam_id = 'exam-001';

UPDATE questions
SET subject = 'Chemistry'
WHERE exam_id = 'exam-002';

UPDATE questions
SET subject = 'Physics'
WHERE exam_id = 'exam-jee-advanced-30q-001'
  AND order_index BETWEEN 0 AND 9;

UPDATE questions
SET subject = 'Chemistry'
WHERE exam_id = 'exam-jee-advanced-30q-001'
  AND order_index BETWEEN 10 AND 19;

UPDATE questions
SET subject = 'Mathematics'
WHERE exam_id = 'exam-jee-advanced-30q-001'
  AND order_index BETWEEN 20 AND 29;
