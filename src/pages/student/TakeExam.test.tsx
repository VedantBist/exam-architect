import { act } from 'react';
import { render, screen } from '@testing-library/react';
import TakeExam from '@/pages/student/TakeExam';
import type { Exam, StudentAttempt } from '@/lib/examStorage';

const mockNavigate = vi.fn();
const mockGetExamById = vi.fn();
const mockGetAttemptsByStudent = vi.fn();
const mockCreateAttempt = vi.fn();
const mockSubmitAttempt = vi.fn();
const mockUpdateAttempt = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastInfo = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ examId: 'exam-001' }),
  };
});

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'student-001',
      email: 'student@example.com',
      fullName: 'Student User',
      role: 'student',
    },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: (...args: unknown[]) => toastInfo(...args),
  },
}));

vi.mock('@/lib/examStorage', () => ({
  getExamById: (...args: unknown[]) => mockGetExamById(...args),
  getAttemptsByStudent: (...args: unknown[]) => mockGetAttemptsByStudent(...args),
  createAttempt: (...args: unknown[]) => mockCreateAttempt(...args),
  submitAttempt: (...args: unknown[]) => mockSubmitAttempt(...args),
  updateAttempt: (...args: unknown[]) => mockUpdateAttempt(...args),
}));

describe('TakeExam timer parity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-14T12:00:00Z'));

    mockNavigate.mockReset();
    mockGetExamById.mockReset();
    mockGetAttemptsByStudent.mockReset();
    mockCreateAttempt.mockReset();
    mockSubmitAttempt.mockReset();
    mockUpdateAttempt.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
    toastInfo.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-submits when countdown reaches zero', async () => {
    const exam: Exam = {
      id: 'exam-001',
      title: 'Physics Test',
      description: 'Timer exam',
      durationMinutes: 1,
      passingPercentage: 40,
      createdBy: 'admin-001',
      status: 'active',
      questions: [
        {
          id: 'q1',
          text: 'What is 2 + 2?',
          type: 'integer',
          marks: 1,
          options: [],
          correctAnswer: 4,
          orderIndex: 0,
        },
      ],
      createdAt: '2026-02-14T11:00:00Z',
      updatedAt: '2026-02-14T11:00:00Z',
    };

    const inProgressAttempt: StudentAttempt = {
      id: 'attempt-001',
      examId: exam.id,
      studentId: 'student-001',
      studentName: 'Student User',
      answers: {},
      score: 0,
      totalMarks: 1,
      percentage: 0,
      status: 'in-progress',
      // Leaves exactly one second remaining.
      startedAt: '2026-02-14T11:59:01Z',
    };

    const submittedAttempt: StudentAttempt = {
      ...inProgressAttempt,
      status: 'submitted',
      submittedAt: '2026-02-14T12:00:01Z',
    };

    mockGetExamById.mockResolvedValue(exam);
    mockGetAttemptsByStudent.mockResolvedValue([]);
    mockCreateAttempt.mockResolvedValue(inProgressAttempt);
    mockSubmitAttempt.mockResolvedValue(submittedAttempt);
    mockUpdateAttempt.mockResolvedValue(inProgressAttempt);

    render(<TakeExam />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Physics Test')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSubmitAttempt).toHaveBeenCalledTimes(1);
    expect(mockSubmitAttempt).toHaveBeenCalledWith('attempt-001', exam);
    expect(toastSuccess).toHaveBeenCalledWith('Time up! Exam auto-submitted');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/my-results');
  });
});
