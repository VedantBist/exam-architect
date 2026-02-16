INSERT INTO exams (
    id,
    title,
    description,
    duration_minutes,
    passing_percentage,
    created_by,
    status
)
VALUES (
    'exam-jee-advanced-30q-001',
    'JEE Advanced Mock Paper - 30 MCQ',
    'Hardcoded 30-question JEE Advanced style MCQ paper for verification and demo progress.',
    180,
    35,
    'admin-001',
    'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (
    id,
    exam_id,
    text,
    type,
    marks,
    order_index,
    correct_answer_text,
    correct_answer_bool,
    correct_answer_number
)
VALUES
    ('jee30-q01', 'exam-jee-advanced-30q-001', 'Which formula gives kinetic energy?', 'mcq', 4, 0, '1/2 m v^2', NULL, NULL),
    ('jee30-q02', 'exam-jee-advanced-30q-001', 'What is the SI unit of electric potential difference?', 'mcq', 4, 1, 'Volt', NULL, NULL),
    ('jee30-q03', 'exam-jee-advanced-30q-001', 'What is the magnitude of a unit vector?', 'mcq', 4, 2, '1', NULL, NULL),
    ('jee30-q04', 'exam-jee-advanced-30q-001', 'A force of 20 N acts on a 4 kg mass. What is acceleration?', 'mcq', 4, 3, '5 m/s^2', NULL, NULL),
    ('jee30-q05', 'exam-jee-advanced-30q-001', 'What is the rest mass of a photon?', 'mcq', 4, 4, 'Zero', NULL, NULL),
    ('jee30-q06', 'exam-jee-advanced-30q-001', 'The ratio of escape velocity to orbital velocity near Earth is:', 'mcq', 4, 5, 'sqrt(2)', NULL, NULL),
    ('jee30-q07', 'exam-jee-advanced-30q-001', 'Work done by a conservative force over a closed path is:', 'mcq', 4, 6, 'Zero', NULL, NULL),
    ('jee30-q08', 'exam-jee-advanced-30q-001', 'For an ideal gas, internal energy depends primarily on:', 'mcq', 4, 7, 'Temperature only', NULL, NULL),
    ('jee30-q09', 'exam-jee-advanced-30q-001', 'Equivalent resistance of 2 ohm and 3 ohm in series is:', 'mcq', 4, 8, '5 ohm', NULL, NULL),
    ('jee30-q10', 'exam-jee-advanced-30q-001', 'If wave speed is constant and frequency doubles, wavelength becomes:', 'mcq', 4, 9, 'Half', NULL, NULL),

    ('jee30-q11', 'exam-jee-advanced-30q-001', 'What is the atomic number of carbon?', 'mcq', 4, 10, '6', NULL, NULL),
    ('jee30-q12', 'exam-jee-advanced-30q-001', 'If [H+] = 1e-3 M, pH is:', 'mcq', 4, 11, '3', NULL, NULL),
    ('jee30-q13', 'exam-jee-advanced-30q-001', 'Avogadro number is approximately:', 'mcq', 4, 12, '6.022e23', NULL, NULL),
    ('jee30-q14', 'exam-jee-advanced-30q-001', 'Oxidation number of oxygen in H2O is:', 'mcq', 4, 13, '-2', NULL, NULL),
    ('jee30-q15', 'exam-jee-advanced-30q-001', 'A catalyst in a reaction typically changes:', 'mcq', 4, 14, 'Rate of reaction', NULL, NULL),
    ('jee30-q16', 'exam-jee-advanced-30q-001', 'Which is strongest acid among these?', 'mcq', 4, 15, 'HCl', NULL, NULL),
    ('jee30-q17', 'exam-jee-advanced-30q-001', 'Maximum electrons in second shell are:', 'mcq', 4, 16, '8', NULL, NULL),
    ('jee30-q18', 'exam-jee-advanced-30q-001', 'Bond type in NaCl is:', 'mcq', 4, 17, 'Ionic', NULL, NULL),
    ('jee30-q19', 'exam-jee-advanced-30q-001', 'Empirical formula of glucose (C6H12O6) is:', 'mcq', 4, 18, 'CH2O', NULL, NULL),
    ('jee30-q20', 'exam-jee-advanced-30q-001', 'Hybridization of carbon in methane is:', 'mcq', 4, 19, 'sp3', NULL, NULL),

    ('jee30-q21', 'exam-jee-advanced-30q-001', 'Derivative of sin(x) is:', 'mcq', 4, 20, 'cos(x)', NULL, NULL),
    ('jee30-q22', 'exam-jee-advanced-30q-001', 'Integral of x from 0 to 1 equals:', 'mcq', 4, 21, '1/2', NULL, NULL),
    ('jee30-q23', 'exam-jee-advanced-30q-001', 'Roots of x^2 - 5x + 6 = 0 are:', 'mcq', 4, 22, '2 and 3', NULL, NULL),
    ('jee30-q24', 'exam-jee-advanced-30q-001', 'Determinant of [[1,2],[3,4]] is:', 'mcq', 4, 23, '-2', NULL, NULL),
    ('jee30-q25', 'exam-jee-advanced-30q-001', 'lim (sin x)/x as x approaches 0 is:', 'mcq', 4, 24, '1', NULL, NULL),
    ('jee30-q26', 'exam-jee-advanced-30q-001', 'Sum of first 10 natural numbers is:', 'mcq', 4, 25, '55', NULL, NULL),
    ('jee30-q27', 'exam-jee-advanced-30q-001', 'If log10(x) = 2, then x =', 'mcq', 4, 26, '100', NULL, NULL),
    ('jee30-q28', 'exam-jee-advanced-30q-001', 'Slope of line 2x + 3y = 6 is:', 'mcq', 4, 27, '-2/3', NULL, NULL),
    ('jee30-q29', 'exam-jee-advanced-30q-001', 'Probability of getting head on one fair coin toss is:', 'mcq', 4, 28, '1/2', NULL, NULL),
    ('jee30-q30', 'exam-jee-advanced-30q-001', 'If f(x) = x^2, then f(3) =', 'mcq', 4, 29, '9', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO question_options (id, question_id, text, is_correct, order_index)
VALUES
    ('jee30-q01-opt1', 'jee30-q01', 'm v^2', FALSE, 0),
    ('jee30-q01-opt2', 'jee30-q01', '1/2 m v^2', TRUE, 1),
    ('jee30-q01-opt3', 'jee30-q01', 'm v', FALSE, 2),
    ('jee30-q01-opt4', 'jee30-q01', 'm / v', FALSE, 3),

    ('jee30-q02-opt1', 'jee30-q02', 'Ampere', FALSE, 0),
    ('jee30-q02-opt2', 'jee30-q02', 'Volt', TRUE, 1),
    ('jee30-q02-opt3', 'jee30-q02', 'Ohm', FALSE, 2),
    ('jee30-q02-opt4', 'jee30-q02', 'Watt', FALSE, 3),

    ('jee30-q03-opt1', 'jee30-q03', '0', FALSE, 0),
    ('jee30-q03-opt2', 'jee30-q03', '1', TRUE, 1),
    ('jee30-q03-opt3', 'jee30-q03', 'sqrt(2)', FALSE, 2),
    ('jee30-q03-opt4', 'jee30-q03', 'Depends on direction', FALSE, 3),

    ('jee30-q04-opt1', 'jee30-q04', '4 m/s^2', FALSE, 0),
    ('jee30-q04-opt2', 'jee30-q04', '5 m/s^2', TRUE, 1),
    ('jee30-q04-opt3', 'jee30-q04', '10 m/s^2', FALSE, 2),
    ('jee30-q04-opt4', 'jee30-q04', '80 m/s^2', FALSE, 3),

    ('jee30-q05-opt1', 'jee30-q05', '1 kg', FALSE, 0),
    ('jee30-q05-opt2', 'jee30-q05', 'Zero', TRUE, 1),
    ('jee30-q05-opt3', 'jee30-q05', 'Depends on frequency', FALSE, 2),
    ('jee30-q05-opt4', 'jee30-q05', '9.1e-31 kg', FALSE, 3),

    ('jee30-q06-opt1', 'jee30-q06', '1', FALSE, 0),
    ('jee30-q06-opt2', 'jee30-q06', 'sqrt(2)', TRUE, 1),
    ('jee30-q06-opt3', 'jee30-q06', '2', FALSE, 2),
    ('jee30-q06-opt4', 'jee30-q06', '1/sqrt(2)', FALSE, 3),

    ('jee30-q07-opt1', 'jee30-q07', 'Maximum', FALSE, 0),
    ('jee30-q07-opt2', 'jee30-q07', 'Minimum', FALSE, 1),
    ('jee30-q07-opt3', 'jee30-q07', 'Zero', TRUE, 2),
    ('jee30-q07-opt4', 'jee30-q07', 'Infinity', FALSE, 3),

    ('jee30-q08-opt1', 'jee30-q08', 'Pressure only', FALSE, 0),
    ('jee30-q08-opt2', 'jee30-q08', 'Volume only', FALSE, 1),
    ('jee30-q08-opt3', 'jee30-q08', 'Temperature only', TRUE, 2),
    ('jee30-q08-opt4', 'jee30-q08', 'Moles only', FALSE, 3),

    ('jee30-q09-opt1', 'jee30-q09', '1.2 ohm', FALSE, 0),
    ('jee30-q09-opt2', 'jee30-q09', '5 ohm', TRUE, 1),
    ('jee30-q09-opt3', 'jee30-q09', '6 ohm', FALSE, 2),
    ('jee30-q09-opt4', 'jee30-q09', '0.5 ohm', FALSE, 3),

    ('jee30-q10-opt1', 'jee30-q10', 'Double', FALSE, 0),
    ('jee30-q10-opt2', 'jee30-q10', 'Half', TRUE, 1),
    ('jee30-q10-opt3', 'jee30-q10', 'Same', FALSE, 2),
    ('jee30-q10-opt4', 'jee30-q10', 'Zero', FALSE, 3),

    ('jee30-q11-opt1', 'jee30-q11', '4', FALSE, 0),
    ('jee30-q11-opt2', 'jee30-q11', '6', TRUE, 1),
    ('jee30-q11-opt3', 'jee30-q11', '8', FALSE, 2),
    ('jee30-q11-opt4', 'jee30-q11', '12', FALSE, 3),

    ('jee30-q12-opt1', 'jee30-q12', '2', FALSE, 0),
    ('jee30-q12-opt2', 'jee30-q12', '3', TRUE, 1),
    ('jee30-q12-opt3', 'jee30-q12', '10', FALSE, 2),
    ('jee30-q12-opt4', 'jee30-q12', '-3', FALSE, 3),

    ('jee30-q13-opt1', 'jee30-q13', '6.022e22', FALSE, 0),
    ('jee30-q13-opt2', 'jee30-q13', '6.022e23', TRUE, 1),
    ('jee30-q13-opt3', 'jee30-q13', '3.011e23', FALSE, 2),
    ('jee30-q13-opt4', 'jee30-q13', '9.81e23', FALSE, 3),

    ('jee30-q14-opt1', 'jee30-q14', '+2', FALSE, 0),
    ('jee30-q14-opt2', 'jee30-q14', '-2', TRUE, 1),
    ('jee30-q14-opt3', 'jee30-q14', '-1', FALSE, 2),
    ('jee30-q14-opt4', 'jee30-q14', '0', FALSE, 3),

    ('jee30-q15-opt1', 'jee30-q15', 'Equilibrium constant', FALSE, 0),
    ('jee30-q15-opt2', 'jee30-q15', 'Rate of reaction', TRUE, 1),
    ('jee30-q15-opt3', 'jee30-q15', 'Initial concentration', FALSE, 2),
    ('jee30-q15-opt4', 'jee30-q15', 'Atomic mass', FALSE, 3),

    ('jee30-q16-opt1', 'jee30-q16', 'HF', FALSE, 0),
    ('jee30-q16-opt2', 'jee30-q16', 'CH3COOH', FALSE, 1),
    ('jee30-q16-opt3', 'jee30-q16', 'H2CO3', FALSE, 2),
    ('jee30-q16-opt4', 'jee30-q16', 'HCl', TRUE, 3),

    ('jee30-q17-opt1', 'jee30-q17', '2', FALSE, 0),
    ('jee30-q17-opt2', 'jee30-q17', '8', TRUE, 1),
    ('jee30-q17-opt3', 'jee30-q17', '18', FALSE, 2),
    ('jee30-q17-opt4', 'jee30-q17', '32', FALSE, 3),

    ('jee30-q18-opt1', 'jee30-q18', 'Covalent', FALSE, 0),
    ('jee30-q18-opt2', 'jee30-q18', 'Ionic', TRUE, 1),
    ('jee30-q18-opt3', 'jee30-q18', 'Metallic', FALSE, 2),
    ('jee30-q18-opt4', 'jee30-q18', 'Hydrogen', FALSE, 3),

    ('jee30-q19-opt1', 'jee30-q19', 'C6H12O6', FALSE, 0),
    ('jee30-q19-opt2', 'jee30-q19', 'CH2O', TRUE, 1),
    ('jee30-q19-opt3', 'jee30-q19', 'C3H6O3', FALSE, 2),
    ('jee30-q19-opt4', 'jee30-q19', 'CHO', FALSE, 3),

    ('jee30-q20-opt1', 'jee30-q20', 'sp', FALSE, 0),
    ('jee30-q20-opt2', 'jee30-q20', 'sp2', FALSE, 1),
    ('jee30-q20-opt3', 'jee30-q20', 'sp3', TRUE, 2),
    ('jee30-q20-opt4', 'jee30-q20', 'dsp2', FALSE, 3),

    ('jee30-q21-opt1', 'jee30-q21', '-sin(x)', FALSE, 0),
    ('jee30-q21-opt2', 'jee30-q21', 'cos(x)', TRUE, 1),
    ('jee30-q21-opt3', 'jee30-q21', 'tan(x)', FALSE, 2),
    ('jee30-q21-opt4', 'jee30-q21', 'sec(x)', FALSE, 3),

    ('jee30-q22-opt1', 'jee30-q22', '1', FALSE, 0),
    ('jee30-q22-opt2', 'jee30-q22', '1/2', TRUE, 1),
    ('jee30-q22-opt3', 'jee30-q22', '2', FALSE, 2),
    ('jee30-q22-opt4', 'jee30-q22', '1/3', FALSE, 3),

    ('jee30-q23-opt1', 'jee30-q23', '1 and 6', FALSE, 0),
    ('jee30-q23-opt2', 'jee30-q23', '2 and 3', TRUE, 1),
    ('jee30-q23-opt3', 'jee30-q23', '-2 and -3', FALSE, 2),
    ('jee30-q23-opt4', 'jee30-q23', '3 and 5', FALSE, 3),

    ('jee30-q24-opt1', 'jee30-q24', '2', FALSE, 0),
    ('jee30-q24-opt2', 'jee30-q24', '-2', TRUE, 1),
    ('jee30-q24-opt3', 'jee30-q24', '10', FALSE, 2),
    ('jee30-q24-opt4', 'jee30-q24', '-10', FALSE, 3),

    ('jee30-q25-opt1', 'jee30-q25', '0', FALSE, 0),
    ('jee30-q25-opt2', 'jee30-q25', '1', TRUE, 1),
    ('jee30-q25-opt3', 'jee30-q25', 'Infinity', FALSE, 2),
    ('jee30-q25-opt4', 'jee30-q25', 'Undefined', FALSE, 3),

    ('jee30-q26-opt1', 'jee30-q26', '45', FALSE, 0),
    ('jee30-q26-opt2', 'jee30-q26', '50', FALSE, 1),
    ('jee30-q26-opt3', 'jee30-q26', '55', TRUE, 2),
    ('jee30-q26-opt4', 'jee30-q26', '60', FALSE, 3),

    ('jee30-q27-opt1', 'jee30-q27', '10', FALSE, 0),
    ('jee30-q27-opt2', 'jee30-q27', '100', TRUE, 1),
    ('jee30-q27-opt3', 'jee30-q27', '1000', FALSE, 2),
    ('jee30-q27-opt4', 'jee30-q27', '0.01', FALSE, 3),

    ('jee30-q28-opt1', 'jee30-q28', '2/3', FALSE, 0),
    ('jee30-q28-opt2', 'jee30-q28', '-2/3', TRUE, 1),
    ('jee30-q28-opt3', 'jee30-q28', '-3/2', FALSE, 2),
    ('jee30-q28-opt4', 'jee30-q28', '3/2', FALSE, 3),

    ('jee30-q29-opt1', 'jee30-q29', '1/4', FALSE, 0),
    ('jee30-q29-opt2', 'jee30-q29', '1/2', TRUE, 1),
    ('jee30-q29-opt3', 'jee30-q29', '3/4', FALSE, 2),
    ('jee30-q29-opt4', 'jee30-q29', '1', FALSE, 3),

    ('jee30-q30-opt1', 'jee30-q30', '6', FALSE, 0),
    ('jee30-q30-opt2', 'jee30-q30', '9', TRUE, 1),
    ('jee30-q30-opt3', 'jee30-q30', '12', FALSE, 2),
    ('jee30-q30-opt4', 'jee30-q30', '18', FALSE, 3)
ON CONFLICT (id) DO NOTHING;
