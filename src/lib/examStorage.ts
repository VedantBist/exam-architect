/**
 * Local storage-based exam management system
 * Independent of any backend, uses localStorage and in-memory data
 */

export interface ExamOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface ExamQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'true_false' | 'integer';
  marks: number;
  options?: ExamOption[];
  correctAnswer?: string | number | boolean;
  orderIndex: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingPercentage: number;
  createdBy: string;
  status: 'created' | 'active' | 'archived';
  questions: ExamQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string | number | boolean>;
  score: number;
  totalMarks: number;
  percentage: number;
  status: 'in-progress' | 'submitted';
  startedAt: string;
  submittedAt?: string;
}

const EXAMS_KEY = 'exams_storage';
const ATTEMPTS_KEY = 'attempts_storage';

// Initialize with sample exams
function initializeSampleExams(): Exam[] {
  return [
    {
      id: 'exam-001',
      title: 'Physics Test',
      description: 'Basic Physics Concepts and Problems',
      durationMinutes: 60,
      passingPercentage: 40,
      createdBy: 'admin-001',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q1',
          text: 'What is the SI unit of velocity?',
          type: 'mcq',
          marks: 1,
          orderIndex: 0,
          options: [
            { id: 'opt1', text: 'm/s', isCorrect: true },
            { id: 'opt2', text: 'km/h', isCorrect: false },
            { id: 'opt3', text: 'cm/s', isCorrect: false },
            { id: 'opt4', text: 'ft/s', isCorrect: false },
          ],
          correctAnswer: 'm/s',
        },
        {
          id: 'q2',
          text: 'Velocity is a scalar quantity.',
          type: 'true_false',
          marks: 1,
          orderIndex: 1,
          correctAnswer: false,
        },
        {
          id: 'q3',
          text: 'If an object moves 100m in 5 seconds, what is its speed in m/s?',
          type: 'integer',
          marks: 1,
          orderIndex: 2,
          correctAnswer: 20,
        },
      ],
    },
    {
      id: 'exam-002',
      title: 'Chemistry Test',
      description: 'Chemical Reactions and Elements',
      durationMinutes: 60,
      passingPercentage: 40,
      createdBy: 'admin-001',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q4',
          text: 'What is the chemical symbol for Gold?',
          type: 'mcq',
          marks: 1,
          orderIndex: 0,
          options: [
            { id: 'opt5', text: 'Au', isCorrect: true },
            { id: 'opt6', text: 'Go', isCorrect: false },
            { id: 'opt7', text: 'Gd', isCorrect: false },
            { id: 'opt8', text: 'Ag', isCorrect: false },
          ],
          correctAnswer: 'Au',
        },
        {
          id: 'q5',
          text: 'Water boils at 100°C at sea level.',
          type: 'true_false',
          marks: 1,
          orderIndex: 1,
          correctAnswer: true,
        },
      ],
    },
  ];
}

export function getExams(): Exam[] {
  try {
    const stored = localStorage.getItem(EXAMS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading exams from localStorage:', error);
  }
  
  // Initialize with sample exams if none exist
  const samples = initializeSampleExams();
  localStorage.setItem(EXAMS_KEY, JSON.stringify(samples));
  return samples;
}

export function getExamById(examId: string): Exam | null {
  const exams = getExams();
  return exams.find(e => e.id === examId) || null;
}

export function getExamsByAdmin(adminId: string): Exam[] {
  const exams = getExams();
  return exams.filter(e => e.createdBy === adminId);
}

export function createExam(exam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>): Exam {
  const exams = getExams();
  const newExam: Exam = {
    ...exam,
    id: `exam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  exams.push(newExam);
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  return newExam;
}

export function updateExam(examId: string, updates: Partial<Exam>): Exam | null {
  const exams = getExams();
  const index = exams.findIndex(e => e.id === examId);
  if (index === -1) return null;

  exams[index] = {
    ...exams[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  return exams[index];
}

export function deleteExam(examId: string): boolean {
  const exams = getExams();
  const index = exams.findIndex(e => e.id === examId);
  if (index === -1) return false;

  exams.splice(index, 1);
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  return true;
}

// Student Attempts
export function getAttempts(): StudentAttempt[] {
  try {
    const stored = localStorage.getItem(ATTEMPTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading attempts from localStorage:', error);
  }
  return [];
}

export function getAttemptsByStudent(studentId: string): StudentAttempt[] {
  const attempts = getAttempts();
  return attempts.filter(a => a.studentId === studentId);
}

export function getAttemptsByExam(examId: string): StudentAttempt[] {
  const attempts = getAttempts();
  return attempts.filter(a => a.examId === examId);
}

export function createAttempt(examId: string, studentId: string, studentName: string, exam: Exam): StudentAttempt {
  const attempts = getAttempts();
  const newAttempt: StudentAttempt = {
    id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    examId,
    studentId,
    studentName,
    answers: {},
    score: 0,
    totalMarks: exam.questions.reduce((sum, q) => sum + q.marks, 0),
    percentage: 0,
    status: 'in-progress',
    startedAt: new Date().toISOString(),
  };
  attempts.push(newAttempt);
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  return newAttempt;
}

export function updateAttempt(attemptId: string, updates: Partial<StudentAttempt>): StudentAttempt | null {
  const attempts = getAttempts();
  const index = attempts.findIndex(a => a.id === attemptId);
  if (index === -1) return null;

  attempts[index] = {
    ...attempts[index],
    ...updates,
  };
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  return attempts[index];
}

export function submitAttempt(attemptId: string, exam: Exam): StudentAttempt | null {
  const attempt = getAttempts().find(a => a.id === attemptId);
  if (!attempt) return null;

  let score = 0;
  for (const question of exam.questions) {
    const answer = attempt.answers[question.id];
    const isCorrect = checkAnswer(question, answer);
    if (isCorrect) {
      score += question.marks;
    }
  }

  const percentage = (score / attempt.totalMarks) * 100;

  return updateAttempt(attemptId, {
    score,
    percentage,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  });
}

export function checkAnswer(question: ExamQuestion, answer: any): boolean {
  if (question.type === 'integer') {
    return Number(answer) === question.correctAnswer;
  }
  return answer === question.correctAnswer;
}

export function getExamStats() {
  const exams = getExams();
  const attempts = getAttempts();
  
  return {
    totalExams: exams.length,
    activeExams: exams.filter(e => e.status === 'active').length,
    totalAttempts: attempts.length,
    submittedAttempts: attempts.filter(a => a.status === 'submitted').length,
  };
}
