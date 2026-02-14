/**
 * Exam storage abstraction.
 *
 * - Local mode: localStorage-backed behavior (current baseline)
 * - API mode: Spring Boot backend (contract-compatible)
 */

import { BackendApiError, fetchBackend, isBackendApiMode } from '@/lib/backendClient';

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

interface ExamStats {
  totalExams: number;
  activeExams: number;
  totalAttempts: number;
  submittedAttempts: number;
}

interface ExamSummaryApi {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingPercentage: number;
  createdBy: string;
  status: 'created' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

const EXAMS_KEY = 'exams_storage';
const ATTEMPTS_KEY = 'attempts_storage';

// Local-mode implementations
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

function getExamsLocal(): Exam[] {
  try {
    const stored = localStorage.getItem(EXAMS_KEY);
    if (stored) {
      return JSON.parse(stored) as Exam[];
    }
  } catch (error) {
    console.error('Error loading exams from localStorage:', error);
  }

  const samples = initializeSampleExams();
  localStorage.setItem(EXAMS_KEY, JSON.stringify(samples));
  return samples;
}

function saveExamsLocal(exams: Exam[]) {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
}

function getAttemptsLocal(): StudentAttempt[] {
  try {
    const stored = localStorage.getItem(ATTEMPTS_KEY);
    if (stored) {
      return JSON.parse(stored) as StudentAttempt[];
    }
  } catch (error) {
    console.error('Error loading attempts from localStorage:', error);
  }
  return [];
}

function saveAttemptsLocal(attempts: StudentAttempt[]) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

function toExamFromSummary(summary: ExamSummaryApi): Exam {
  return {
    ...summary,
    questions: [],
  };
}

function toExamFromApi(exam: Exam): Exam {
  return {
    ...exam,
    questions: (exam.questions || []).map((question, idx) => ({
      ...question,
      orderIndex: question.orderIndex ?? idx,
      options: question.options || [],
    })),
  };
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof BackendApiError && error.status === 404;
}

export async function getExams(): Promise<Exam[]> {
  if (isBackendApiMode()) {
    const response = await fetchBackend<ExamSummaryApi[]>('/exams');
    return response.map(toExamFromSummary);
  }

  return getExamsLocal();
}

export async function getExamById(examId: string): Promise<Exam | null> {
  if (isBackendApiMode()) {
    try {
      const response = await fetchBackend<Exam>(`/exams/${examId}`);
      return toExamFromApi(response);
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  return getExamsLocal().find((exam) => exam.id === examId) || null;
}

export async function getExamsByAdmin(adminId: string): Promise<Exam[]> {
  const exams = await getExams();
  return exams.filter((exam) => exam.createdBy === adminId);
}

export async function createExam(exam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exam> {
  if (isBackendApiMode()) {
    const response = await fetchBackend<Exam>('/exams', {
      method: 'POST',
      body: JSON.stringify(exam),
    });
    return toExamFromApi(response);
  }

  const exams = getExamsLocal();
  const newExam: Exam = {
    ...exam,
    id: `exam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  exams.push(newExam);
  saveExamsLocal(exams);
  return newExam;
}

export async function updateExam(examId: string, updates: Partial<Exam>): Promise<Exam | null> {
  if (isBackendApiMode()) {
    try {
      const response = await fetchBackend<Exam>(`/exams/${examId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return toExamFromApi(response);
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  const exams = getExamsLocal();
  const index = exams.findIndex((exam) => exam.id === examId);
  if (index === -1) return null;

  exams[index] = {
    ...exams[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveExamsLocal(exams);
  return exams[index];
}

export async function deleteExam(examId: string): Promise<boolean> {
  if (isBackendApiMode()) {
    try {
      await fetchBackend<void>(`/exams/${examId}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      if (isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  const exams = getExamsLocal();
  const index = exams.findIndex((exam) => exam.id === examId);
  if (index === -1) return false;

  exams.splice(index, 1);
  saveExamsLocal(exams);
  return true;
}

export async function getAttempts(studentId?: string): Promise<StudentAttempt[]> {
  if (isBackendApiMode()) {
    if (!studentId) {
      return [];
    }
    return fetchBackend<StudentAttempt[]>(`/attempts?studentId=${encodeURIComponent(studentId)}`);
  }

  return getAttemptsLocal();
}

export async function getAttemptsByStudent(studentId: string): Promise<StudentAttempt[]> {
  if (isBackendApiMode()) {
    return fetchBackend<StudentAttempt[]>(`/attempts?studentId=${encodeURIComponent(studentId)}`);
  }

  return getAttemptsLocal().filter((attempt) => attempt.studentId === studentId);
}

export async function getAttemptsByExam(examId: string): Promise<StudentAttempt[]> {
  if (isBackendApiMode()) {
    return [];
  }

  return getAttemptsLocal().filter((attempt) => attempt.examId === examId);
}

export async function createAttempt(
  examId: string,
  studentId: string,
  studentName: string,
  exam: Exam
): Promise<StudentAttempt> {
  if (isBackendApiMode()) {
    return fetchBackend<StudentAttempt>('/attempts', {
      method: 'POST',
      body: JSON.stringify({ examId, studentId, studentName }),
    });
  }

  const attempts = getAttemptsLocal();
  const newAttempt: StudentAttempt = {
    id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    examId,
    studentId,
    studentName,
    answers: {},
    score: 0,
    totalMarks: exam.questions.reduce((sum, question) => sum + question.marks, 0),
    percentage: 0,
    status: 'in-progress',
    startedAt: new Date().toISOString(),
  };
  attempts.push(newAttempt);
  saveAttemptsLocal(attempts);
  return newAttempt;
}

export async function updateAttempt(attemptId: string, updates: Partial<StudentAttempt>): Promise<StudentAttempt | null> {
  if (isBackendApiMode()) {
    try {
      const response = await fetchBackend<StudentAttempt>(`/attempts/${attemptId}`, {
        method: 'PATCH',
        body: JSON.stringify({ answers: updates.answers ?? {} }),
      });
      return response;
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  const attempts = getAttemptsLocal();
  const index = attempts.findIndex((attempt) => attempt.id === attemptId);
  if (index === -1) return null;

  attempts[index] = {
    ...attempts[index],
    ...updates,
  };
  saveAttemptsLocal(attempts);
  return attempts[index];
}

export async function submitAttempt(attemptId: string, exam: Exam): Promise<StudentAttempt | null> {
  if (isBackendApiMode()) {
    try {
      return await fetchBackend<StudentAttempt>(`/attempts/${attemptId}/submit`, {
        method: 'POST',
      });
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  const attempt = getAttemptsLocal().find((candidate) => candidate.id === attemptId);
  if (!attempt) return null;

  let score = 0;
  for (const question of exam.questions) {
    const answer = attempt.answers[question.id];
    if (checkAnswer(question, answer)) {
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

export function checkAnswer(question: ExamQuestion, answer: unknown): boolean {
  if (question.type === 'integer') {
    return Number(answer) === question.correctAnswer;
  }

  return answer === question.correctAnswer;
}

export async function getExamStats(): Promise<ExamStats> {
  if (isBackendApiMode()) {
    return fetchBackend<ExamStats>('/stats/exams');
  }

  const exams = getExamsLocal();
  const attempts = getAttemptsLocal();

  return {
    totalExams: exams.length,
    activeExams: exams.filter((exam) => exam.status === 'active').length,
    totalAttempts: attempts.length,
    submittedAttempts: attempts.filter((attempt) => attempt.status === 'submitted').length,
  };
}
