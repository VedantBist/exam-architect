/**
 * Hardcoded JEE Test Data
 * Contains sample JEE physics, chemistry, and math questions
 */

export interface ExamTemplate {
  title: string;
  description: string;
  durationMinutes: number;
  passingPercentage: number;
  questions: QuestionTemplate[];
}

export interface QuestionTemplate {
  text: string;
  type: 'mcq' | 'true_false' | 'integer';
  marks: number;
  correctAnswer: string;
  options?: string[];
}

// JEE Main Physics Test
export const jeePhysicsTest: ExamTemplate = {
  title: 'JEE Main Physics - Practice Test 1',
  description: 'Practice test covering mechanics, waves, and thermodynamics',
  durationMinutes: 60,
  passingPercentage: 40,
  questions: [
    {
      text: 'A projectile is fired at an angle of 45° with the horizontal. What is the ratio of vertical to horizontal components of velocity?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_1',
      options: [
        '1:1',
        '2:1',
        '1:√2',
        '√2:1',
      ],
    },
    {
      text: 'The speed of light in a medium is 2×10⁸ m/s. What is the refractive index of the medium?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_2',
      options: [
        '0.67',
        '1.5',
        '2.0',
        '3.0',
      ],
    },
    {
      text: 'A spring with spring constant k = 100 N/m is stretched by 0.1 m. Calculate the elastic potential energy stored.',
      type: 'integer',
      marks: 4,
      correctAnswer: '0.5',
      options: undefined,
    },
    {
      text: 'The period of a simple pendulum is independent of its mass.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    {
      text: 'In an isothermal process, the internal energy of an ideal gas remains constant.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    {
      text: 'Two objects of masses 2 kg and 3 kg are moving at 5 m/s and 4 m/s respectively in the same direction. What is their total momentum?',
      type: 'integer',
      marks: 4,
      correctAnswer: '22',
      options: undefined,
    },
    {
      text: 'Which of the following represents the correct relationship between force and acceleration?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_1',
      options: [
        'F = ma',
        'F = m/a',
        'F = a/m',
        'F = m + a',
      ],
    },
    {
      text: 'The velocity of sound in air increases with temperature.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
  ],
};

// JEE Main Chemistry Test
export const jeeChemistryTest: ExamTemplate = {
  title: 'JEE Main Chemistry - Practice Test 1',
  description: 'Practice test covering stoichiometry, atomic structure, and reactions',
  durationMinutes: 60,
  passingPercentage: 40,
  questions: [
    {
      text: 'What is the oxidation state of nitrogen in NO₂?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_2',
      options: [
        '+1',
        '+4',
        '+3',
        '+5',
      ],
    },
    {
      text: 'Calculate the molarity of 2 moles of NaCl dissolved in 500 mL of solution.',
      type: 'integer',
      marks: 4,
      correctAnswer: '4',
      options: undefined,
    },
    {
      text: 'The pH of a neutral solution at 25°C is 7.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    {
      text: 'Hydrogen bonding occurs in H₂O, NH₃, and HF molecules.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    {
      text: 'Which of the following is the strongest acid?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_3',
      options: [
        'CH₃COOH',
        'HCN',
        'HCl',
        'H₂SO₃',
      ],
    },
    {
      text: 'The atomic number of carbon is 6. How many electrons are in the valence shell?',
      type: 'integer',
      marks: 4,
      correctAnswer: '4',
      options: undefined,
    },
    {
      text: 'Electronegativity increases across a period from left to right.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    {
      text: 'What is the correct electron configuration of Oxygen (Z=8)?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_2',
      options: [
        '1s² 2s² 2p³',
        '1s² 2s² 2p⁴',
        '1s² 2s¹ 2p⁵',
        '1s¹ 2s² 2p⁵',
      ],
    },
  ],
};

// JEE Main Mathematics Test
export const jeeMathematicsTest: ExamTemplate = {
  title: 'JEE Main Mathematics - Practice Test 1',
  description: 'Practice test covering algebra, trigonometry, and calculus',
  durationMinutes: 60,
  passingPercentage: 40,
  questions: [
    {
      text: 'What is the derivative of x³ + 2x² + 5x + 1?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_1',
      options: [
        '3x² + 4x + 5',
        '3x² + 2x + 5',
        'x² + 2x + 1',
        '3x + 4',
      ],
    },
    {
      text: 'If sin(θ) = 3/5, find cos(θ) assuming θ is in the first quadrant.',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_2',
      options: [
        '4/5',
        '4/5',
        '3/4',
        '5/3',
      ],
    },
    {
      text: 'The sum of the roots of the quadratic equation x² - 5x + 6 = 0 is:',
      type: 'integer',
      marks: 4,
      correctAnswer: '5',
      options: undefined,
    },
    {
      text: 'tan(45°) = 1',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    {
      text: 'The value of log₁₀(100) is:',
      type: 'integer',
      marks: 4,
      correctAnswer: '2',
      options: undefined,
    },
    {
      text: 'Find the value of sin(90°):',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_2',
      options: [
        '0',
        '1',
        '-1',
        '∞',
      ],
    },
    {
      text: 'e^x is always positive for all real values of x.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    {
      text: 'The area under the curve y = x from 0 to 1 is:',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_2',
      options: [
        '0',
        '0.5',
        '1',
        '2',
      ],
    },
  ],
};

// Combined JEE Main Mock Test (Short Version)
export const jeeMainMockTest: ExamTemplate = {
  title: 'JEE Main - Combined Mock Test',
  description: 'Full length mock test with physics, chemistry, and mathematics',
  durationMinutes: 180,
  passingPercentage: 40,
  questions: [
    // Physics Questions
    {
      text: 'A ball is dropped from a height of 20 m. How long will it take to reach the ground? (Assume g = 10 m/s²)',
      type: 'integer',
      marks: 4,
      correctAnswer: '2',
      options: undefined,
    },
    {
      text: 'The SI unit of work is:',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_1',
      options: [
        'Joule',
        'Newton',
        'Watt',
        'Pascal',
      ],
    },
    {
      text: 'Light travels in straight lines in a homogeneous medium.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    // Chemistry Questions
    {
      text: 'What is the molar mass of H₂SO₄?',
      type: 'integer',
      marks: 4,
      correctAnswer: '98',
      options: undefined,
    },
    {
      text: 'Water has a boiling point of 100°C at standard atmospheric pressure.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
    {
      text: 'Which is the most abundant element in the human body?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_2',
      options: [
        'Carbon',
        'Oxygen',
        'Nitrogen',
        'Hydrogen',
      ],
    },
    // Mathematics Questions
    {
      text: 'What is the value of π (approximately)?',
      type: 'mcq',
      marks: 4,
      correctAnswer: 'option_2',
      options: [
        '2.14',
        '3.14',
        '4.14',
        '5.14',
      ],
    },
    {
      text: 'The square root of 144 is:',
      type: 'integer',
      marks: 4,
      correctAnswer: '12',
      options: undefined,
    },
    {
      text: 'sin²(θ) + cos²(θ) = 1 for all values of θ.',
      type: 'true_false',
      marks: 2,
      correctAnswer: 'true',
      options: undefined,
    },
  ],
};

// Export all templates
export const examTemplates: Record<string, ExamTemplate> = {
  jeePhysics: jeePhysicsTest,
  jeeChemistry: jeeChemistryTest,
  jeeMathematics: jeeMathematicsTest,
  jeeMainMock: jeeMainMockTest,
};
