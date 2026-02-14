INSERT INTO users (id, email, full_name, role, password_hash)
VALUES
    ('admin-001', 'admin@example.com', 'Admin User', 'admin', 'admin123'),
    ('student-001', 'student@example.com', 'Student User', 'student', 'student123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO exams (id, title, description, duration_minutes, passing_percentage, created_by, status)
VALUES
    ('exam-001', 'Physics Test', 'Basic Physics Concepts and Problems', 60, 40, 'admin-001', 'active'),
    ('exam-002', 'Chemistry Test', 'Chemical Reactions and Elements', 60, 40, 'admin-001', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, exam_id, text, type, marks, order_index, correct_answer_text, correct_answer_bool, correct_answer_number)
VALUES
    ('q1', 'exam-001', 'What is the SI unit of velocity?', 'mcq', 1, 0, 'm/s', NULL, NULL),
    ('q2', 'exam-001', 'Velocity is a scalar quantity.', 'true_false', 1, 1, NULL, FALSE, NULL),
    ('q3', 'exam-001', 'If an object moves 100m in 5 seconds, what is its speed in m/s?', 'integer', 1, 2, NULL, NULL, 20),
    ('q4', 'exam-002', 'What is the chemical symbol for Gold?', 'mcq', 1, 0, 'Au', NULL, NULL),
    ('q5', 'exam-002', 'Water boils at 100°C at sea level.', 'true_false', 1, 1, NULL, TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, text, is_correct, order_index)
VALUES
    ('opt1', 'q1', 'm/s', TRUE, 0),
    ('opt2', 'q1', 'km/h', FALSE, 1),
    ('opt3', 'q1', 'cm/s', FALSE, 2),
    ('opt4', 'q1', 'ft/s', FALSE, 3),
    ('opt5', 'q4', 'Au', TRUE, 0),
    ('opt6', 'q4', 'Go', FALSE, 1),
    ('opt7', 'q4', 'Gd', FALSE, 2),
    ('opt8', 'q4', 'Ag', FALSE, 3)
ON CONFLICT (id) DO NOTHING;
