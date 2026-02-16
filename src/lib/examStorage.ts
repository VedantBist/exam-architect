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

export type InsightTrend = 'improving' | 'declining' | 'stable' | 'insufficient_data';

export interface QuestionTypeInsight {
  type: 'mcq' | 'true_false' | 'integer';
  correct: number;
  total: number;
  accuracy: number;
}

export interface RecentAttemptInsight {
  attemptId: string;
  examId: string;
  examTitle: string;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface StudentInsights {
  studentId: string;
  studentName: string | null;
  submittedAttempts: number;
  averagePercentage: number;
  latestPercentage: number;
  passRate: number;
  predictedNextPercentage: number;
  trend: InsightTrend;
  strongestQuestionType: QuestionTypeInsight | null;
  weakestQuestionType: QuestionTypeInsight | null;
  recentAttempts: RecentAttemptInsight[];
  recommendations: string[];
}

export interface AtRiskStudentInsight {
  studentId: string;
  studentName: string;
  attempts: number;
  averagePercentage: number;
  trend: InsightTrend;
}

export interface ExamDifficultyInsight {
  examId: string;
  examTitle: string;
  attempts: number;
  averagePercentage: number;
  passRate: number;
}

export interface DailyTrendInsight {
  date: string;
  attempts: number;
  averagePercentage: number;
  passRate: number;
}

export interface AdminInsights {
  submittedAttempts: number;
  uniqueStudents: number;
  averagePercentage: number;
  passRate: number;
  atRiskStudents: AtRiskStudentInsight[];
  hardestExams: ExamDifficultyInsight[];
  recentDailyTrend: DailyTrendInsight[];
  recommendations: string[];
}

export interface AssistantConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatResponse {
  mode: 'live' | 'fallback';
  reply: string;
  keyPoints: string[];
  nextActions: string[];
  generatedAt: string;
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
const DEFAULT_PASSING_PERCENTAGE = 40;

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

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function getSubmittedAttempts(attempts: StudentAttempt[]): StudentAttempt[] {
  return attempts
    .filter((attempt) => attempt.status === 'submitted' && !!attempt.submittedAt)
    .sort(
      (a, b) =>
        new Date(b.submittedAt as string).getTime() - new Date(a.submittedAt as string).getTime()
    );
}

function isPassingAttempt(attempt: StudentAttempt, exam?: Exam): boolean {
  return attempt.percentage >= (exam?.passingPercentage ?? DEFAULT_PASSING_PERCENTAGE);
}

function predictNextPercentage(percentagesAscending: number[]): number {
  if (percentagesAscending.length === 0) return 0;

  let weightedTotal = 0;
  let weightSum = 0;
  for (let index = 0; index < percentagesAscending.length; index += 1) {
    const weight = index + 1;
    weightedTotal += percentagesAscending[index] * weight;
    weightSum += weight;
  }

  return round2(weightedTotal / weightSum);
}

function computeTrendLabel(percentagesAscending: number[]): InsightTrend {
  if (percentagesAscending.length < 2) {
    return 'insufficient_data';
  }

  const recentWindowSize = Math.max(1, Math.min(3, Math.floor(percentagesAscending.length / 2)));
  const recent = percentagesAscending.slice(-recentWindowSize);
  const previous = percentagesAscending.slice(-2 * recentWindowSize, -recentWindowSize);

  const previousAverage =
    previous.length > 0
      ? previous.reduce((sum, value) => sum + value, 0) / previous.length
      : percentagesAscending[0];
  const recentAverage = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const delta = recentAverage - previousAverage;

  if (delta >= 3) return 'improving';
  if (delta <= -3) return 'declining';
  return 'stable';
}

function buildZeroDailyTrend(): DailyTrendInsight[] {
  const today = new Date();
  const trend: DailyTrendInsight[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset)
    );
    trend.push({
      date: date.toISOString().slice(0, 10),
      attempts: 0,
      averagePercentage: 0,
      passRate: 0,
    });
  }

  return trend;
}

function buildStudentRecommendations(
  submittedAttempts: number,
  passRate: number,
  trend: InsightTrend,
  weakestQuestionType: QuestionTypeInsight | null
): string[] {
  const recommendations: string[] = [];

  if (submittedAttempts < 3) {
    recommendations.push(
      'Attempt 2-3 more exams to improve trend confidence and prediction accuracy.'
    );
  }

  if (passRate < 60) {
    recommendations.push(
      'Pass rate is below 60%. Revisit fundamentals before your next timed attempt.'
    );
  }

  if (weakestQuestionType?.type === 'mcq') {
    recommendations.push('MCQ is your weakest area. Practice elimination and distractor analysis.');
  } else if (weakestQuestionType?.type === 'integer') {
    recommendations.push(
      'Integer questions are weakest. Focus on step-wise calculations and unit checks.'
    );
  } else if (weakestQuestionType?.type === 'true_false') {
    recommendations.push(
      'True/False is weakest. Review concept statements and definition-heavy topics.'
    );
  }

  if (trend === 'declining') {
    recommendations.push(
      'Recent scores are declining. Review mistakes from your last two attempts first.'
    );
  } else if (trend === 'improving') {
    recommendations.push(
      'Trend is improving. Gradually increase exam difficulty to maintain momentum.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Performance is stable. Continue one full mock test and one revision session weekly.'
    );
  }

  return recommendations.slice(0, 4);
}

function buildAdminRecommendations(
  passRate: number,
  hardestExams: ExamDifficultyInsight[],
  atRiskStudents: AtRiskStudentInsight[]
): string[] {
  const recommendations: string[] = [];

  if (passRate < 55) {
    recommendations.push(
      'Overall pass rate is below 55%. Consider revisiting exam difficulty calibration.'
    );
  }

  if (hardestExams[0] && hardestExams[0].averagePercentage < 45) {
    recommendations.push(
      'Top hardest exam has low average performance. Audit question clarity and balance.'
    );
  }

  if (atRiskStudents.length > 0) {
    recommendations.push(
      'At-risk students detected. Plan targeted support for low-average or declining learners.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Cohort performance is healthy. Keep monitoring weekly trends for early regressions.'
    );
  }

  return recommendations.slice(0, 4);
}

function buildStudentAssistantFallback(
  message: string,
  insights: StudentInsights
): AssistantChatResponse {
  const normalizedMessage = message.toLowerCase();
  const weakest = insights.weakestQuestionType?.type.replace('_', ' ') ?? 'insufficient data';

  let reply = `Current trend is ${insights.trend.replace('_', ' ')}, pass rate is ${insights.passRate.toFixed(
    1
  )}%, and predicted next score is ${insights.predictedNextPercentage.toFixed(
    1
  )}%. Weakest area is ${weakest}.`;

  if (normalizedMessage.includes('weak')) {
    reply = `Your weakest area is ${weakest}. Focus revision there first before taking another full mock.`;
  } else if (normalizedMessage.includes('trend')) {
    reply = `Your trend is ${insights.trend.replace(
      '_',
      ' '
    )}. Maintain consistency and review mistakes from your latest attempts.`;
  }

  return {
    mode: 'fallback',
    reply,
    keyPoints: [
      `Trend: ${insights.trend.replace('_', ' ')}`,
      `Pass Rate: ${insights.passRate.toFixed(1)}%`,
      `Predicted Next: ${insights.predictedNextPercentage.toFixed(1)}%`,
    ],
    nextActions: insights.recommendations.slice(0, 4),
    generatedAt: new Date().toISOString(),
  };
}

function buildAdminAssistantFallback(
  message: string,
  insights: AdminInsights
): AssistantChatResponse {
  const normalizedMessage = message.toLowerCase();
  const hardestExam = insights.hardestExams[0]?.examTitle ?? 'insufficient data';

  let reply = `Overall pass rate is ${insights.passRate.toFixed(
    1
  )}% with ${insights.atRiskStudents.length} at-risk students. Hardest exam is ${hardestExam}.`;
  if (normalizedMessage.includes('risk')) {
    reply = `There are ${insights.atRiskStudents.length} at-risk students. Prioritize targeted support for declining or low-average learners.`;
  } else if (normalizedMessage.includes('hard')) {
    reply = `Hardest exam is ${hardestExam}. Review question quality and difficulty balance in that paper.`;
  }

  return {
    mode: 'fallback',
    reply,
    keyPoints: [
      `Overall Pass Rate: ${insights.passRate.toFixed(1)}%`,
      `At-Risk Students: ${insights.atRiskStudents.length}`,
      `Hardest Exam: ${hardestExam}`,
    ],
    nextActions: insights.recommendations.slice(0, 4),
    generatedAt: new Date().toISOString(),
  };
}

function buildStudentInsightsLocal(studentId: string): StudentInsights {
  const submittedAttempts = getSubmittedAttempts(
    getAttemptsLocal().filter((attempt) => attempt.studentId === studentId)
  );

  if (submittedAttempts.length === 0) {
    return {
      studentId,
      studentName: null,
      submittedAttempts: 0,
      averagePercentage: 0,
      latestPercentage: 0,
      passRate: 0,
      predictedNextPercentage: 0,
      trend: 'insufficient_data',
      strongestQuestionType: null,
      weakestQuestionType: null,
      recentAttempts: [],
      recommendations: [
        'Complete at least one exam submission to unlock personalized AI insights.',
      ],
    };
  }

  const examsById = new Map(getExamsLocal().map((exam) => [exam.id, exam]));
  const percentagesDescending = submittedAttempts.map((attempt) => attempt.percentage);
  const percentagesAscending = [...percentagesDescending].reverse();
  const averagePercentage = round2(
    percentagesDescending.reduce((sum, value) => sum + value, 0) / percentagesDescending.length
  );
  const latestPercentage = round2(percentagesDescending[0]);
  const passRate = round2(
    (submittedAttempts.filter((attempt) => isPassingAttempt(attempt, examsById.get(attempt.examId)))
      .length *
      100) /
      submittedAttempts.length
  );

  const counters: Partial<Record<QuestionTypeInsight['type'], { correct: number; total: number }>> = {};
  for (const attempt of submittedAttempts) {
    const exam = examsById.get(attempt.examId);
    if (!exam || exam.questions.length === 0) continue;

    for (const question of exam.questions) {
      const bucket = counters[question.type] || { correct: 0, total: 0 };
      bucket.total += 1;

      const answer = attempt.answers[question.id];
      if (answer !== undefined && checkAnswer(question, answer)) {
        bucket.correct += 1;
      }

      counters[question.type] = bucket;
    }
  }

  const typeInsights = Object.entries(counters).map(([type, bucket]) => {
    const typedBucket = bucket as { correct: number; total: number };
    return {
      type: type as QuestionTypeInsight['type'],
      correct: typedBucket.correct,
      total: typedBucket.total,
      accuracy:
        typedBucket.total > 0 ? round2((typedBucket.correct * 100) / typedBucket.total) : 0,
    } as QuestionTypeInsight;
  });

  const strongestQuestionType =
    [...typeInsights].sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0] || null;
  const weakestQuestionType =
    [...typeInsights].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0] || null;

  const recentAttempts: RecentAttemptInsight[] = submittedAttempts.slice(0, 5).map((attempt) => {
    const exam = examsById.get(attempt.examId);
    return {
      attemptId: attempt.id,
      examId: attempt.examId,
      examTitle: exam?.title ?? attempt.examId,
      percentage: round2(attempt.percentage),
      passed: isPassingAttempt(attempt, exam),
      submittedAt: attempt.submittedAt as string,
    };
  });

  const trend = computeTrendLabel(percentagesAscending);

  return {
    studentId,
    studentName: submittedAttempts[0].studentName,
    submittedAttempts: submittedAttempts.length,
    averagePercentage,
    latestPercentage,
    passRate,
    predictedNextPercentage: predictNextPercentage(percentagesAscending),
    trend,
    strongestQuestionType,
    weakestQuestionType,
    recentAttempts,
    recommendations: buildStudentRecommendations(
      submittedAttempts.length,
      passRate,
      trend,
      weakestQuestionType
    ),
  };
}

function buildAdminInsightsLocal(): AdminInsights {
  const submittedAttempts = getSubmittedAttempts(getAttemptsLocal());
  if (submittedAttempts.length === 0) {
    return {
      submittedAttempts: 0,
      uniqueStudents: 0,
      averagePercentage: 0,
      passRate: 0,
      atRiskStudents: [],
      hardestExams: [],
      recentDailyTrend: buildZeroDailyTrend(),
      recommendations: ['No submitted attempts yet. Insights will populate after exam submissions.'],
    };
  }

  const examsById = new Map(getExamsLocal().map((exam) => [exam.id, exam]));
  const averagePercentage = round2(
    submittedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / submittedAttempts.length
  );
  const passRate = round2(
    (submittedAttempts.filter((attempt) => isPassingAttempt(attempt, examsById.get(attempt.examId)))
      .length *
      100) /
      submittedAttempts.length
  );

  const attemptsByExam = new Map<string, StudentAttempt[]>();
  const attemptsByStudent = new Map<string, StudentAttempt[]>();
  const attemptsByDate = new Map<string, StudentAttempt[]>();

  for (const attempt of submittedAttempts) {
    attemptsByExam.set(attempt.examId, [...(attemptsByExam.get(attempt.examId) || []), attempt]);
    attemptsByStudent.set(attempt.studentId, [
      ...(attemptsByStudent.get(attempt.studentId) || []),
      attempt,
    ]);

    const date = new Date(attempt.submittedAt as string).toISOString().slice(0, 10);
    attemptsByDate.set(date, [...(attemptsByDate.get(date) || []), attempt]);
  }

  const hardestExams = [...attemptsByExam.entries()]
    .map(([examId, attempts]) => {
      const exam = examsById.get(examId);
      const average = round2(
        attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length
      );
      const examPassRate = round2(
        (attempts.filter((attempt) => isPassingAttempt(attempt, exam)).length * 100) / attempts.length
      );

      return {
        examId,
        examTitle: exam?.title ?? examId,
        attempts: attempts.length,
        averagePercentage: average,
        passRate: examPassRate,
      };
    })
    .sort((a, b) => a.averagePercentage - b.averagePercentage || a.passRate - b.passRate)
    .slice(0, 5);

  const atRiskStudents = [...attemptsByStudent.entries()]
    .map(([studentId, attempts]) => {
      const ordered = [...attempts].sort(
        (a, b) =>
          new Date(a.submittedAt as string).getTime() - new Date(b.submittedAt as string).getTime()
      );
      const average = round2(
        ordered.reduce((sum, attempt) => sum + attempt.percentage, 0) / ordered.length
      );
      const trend = computeTrendLabel(ordered.map((attempt) => attempt.percentage));

      return {
        studentId,
        studentName: ordered[ordered.length - 1].studentName,
        attempts: ordered.length,
        averagePercentage: average,
        trend,
      } as AtRiskStudentInsight;
    })
    .filter((student) => student.averagePercentage < 50 || student.trend === 'declining')
    .sort((a, b) => a.averagePercentage - b.averagePercentage)
    .slice(0, 8);

  const today = new Date();
  const recentDailyTrend: DailyTrendInsight[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset)
    )
      .toISOString()
      .slice(0, 10);
    const attempts = attemptsByDate.get(date) || [];

    if (attempts.length === 0) {
      recentDailyTrend.push({ date, attempts: 0, averagePercentage: 0, passRate: 0 });
      continue;
    }

    const dayAverage = round2(
      attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length
    );
    const dayPassRate = round2(
      (attempts.filter((attempt) => isPassingAttempt(attempt, examsById.get(attempt.examId))).length *
        100) /
        attempts.length
    );

    recentDailyTrend.push({
      date,
      attempts: attempts.length,
      averagePercentage: dayAverage,
      passRate: dayPassRate,
    });
  }

  return {
    submittedAttempts: submittedAttempts.length,
    uniqueStudents: attemptsByStudent.size,
    averagePercentage,
    passRate,
    atRiskStudents,
    hardestExams,
    recentDailyTrend,
    recommendations: buildAdminRecommendations(passRate, hardestExams, atRiskStudents),
  };
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

export async function getStudentInsights(studentId: string): Promise<StudentInsights> {
  if (isBackendApiMode()) {
    return fetchBackend<StudentInsights>(`/insights/student/${encodeURIComponent(studentId)}`);
  }

  return buildStudentInsightsLocal(studentId);
}

export async function getAdminInsights(): Promise<AdminInsights> {
  if (isBackendApiMode()) {
    return fetchBackend<AdminInsights>('/insights/admin/overview');
  }

  return buildAdminInsightsLocal();
}

export async function askAssistant(
  message: string,
  options?: {
    studentId?: string;
    history?: AssistantConversationTurn[];
  }
): Promise<AssistantChatResponse> {
  const trimmed = message.trim();
  const history = (options?.history || []).slice(-10);

  if (isBackendApiMode()) {
    return fetchBackend<AssistantChatResponse>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: trimmed,
        studentId: options?.studentId,
        history,
      }),
    });
  }

  if (options?.studentId) {
    const insights = buildStudentInsightsLocal(options.studentId);
    return buildStudentAssistantFallback(trimmed, insights);
  }

  const adminInsights = buildAdminInsightsLocal();
  return buildAdminAssistantFallback(trimmed, adminInsights);
}
