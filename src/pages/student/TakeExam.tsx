import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  createAttempt,
  getAttemptsByStudent,
  getExamById,
  submitAttempt,
  updateAttempt,
  type Exam as StoredExam,
  type StudentAttempt,
} from '@/lib/examStorage';

const TRUE_FALSE_OPTIONS = [
  { id: 'true', label: 'True' },
  { id: 'false', label: 'False' },
];

function isAnsweredValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  return String(value).trim() !== '';
}

function getRemainingTimeInSeconds(attempt: StudentAttempt, durationMinutes: number): number {
  const startedAt = new Date(attempt.startedAt).getTime();
  const endAt = startedAt + durationMinutes * 60 * 1000;
  return Math.max(0, Math.floor((endAt - Date.now()) / 1000));
}

export default function TakeExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<StoredExam | null>(null);
  const [attempt, setAttempt] = useState<StudentAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptId = attempt?.id;
  const attemptStatus = attempt?.status;

  const submitExam = useCallback(
    async (attemptId: string, isAutoSubmit = false, examOverride?: StoredExam) => {
      const activeExam = examOverride ?? exam;
      if (!activeExam) return;

      setSubmitting(true);
      try {
        const submittedAttempt = submitAttempt(attemptId, activeExam);
        if (!submittedAttempt) {
          throw new Error('Attempt not found');
        }

        setAttempt(submittedAttempt);
        toast.success(isAutoSubmit ? 'Time up! Exam auto-submitted' : 'Exam submitted successfully!');
        navigate('/dashboard/my-results');
      } catch (error) {
        console.error('Error submitting exam:', error);
        toast.error('Failed to submit exam');
      } finally {
        setSubmitting(false);
        setShowSubmitDialog(false);
      }
    },
    [exam, navigate]
  );

  const initializeExam = useCallback(async () => {
    try {
      if (!examId || !user) {
        setLoading(false);
        return;
      }

      const examData = getExamById(examId);
      if (!examData) {
        toast.error('Exam not found');
        navigate('/dashboard/my-exams');
        return;
      }

      if (examData.status !== 'active') {
        toast.error('This exam is not currently active');
        navigate('/dashboard/my-exams');
        return;
      }

      setExam(examData);

      const existingAttempt = getAttemptsByStudent(user.id).find((a) => a.examId === examId);
      if (existingAttempt && existingAttempt.status === 'submitted') {
        toast.info('You have already completed this exam');
        navigate('/dashboard/my-results');
        return;
      }

      const currentAttempt =
        existingAttempt ?? createAttempt(examId, user.id, user.fullName, examData);

      const remainingTime = getRemainingTimeInSeconds(currentAttempt, examData.durationMinutes);
      if (remainingTime <= 0 && currentAttempt.status === 'in-progress') {
        await submitExam(currentAttempt.id, true, examData);
        return;
      }

      setAttempt(currentAttempt);
      setTimeLeft(remainingTime);
    } catch (error) {
      console.error('Error initializing exam:', error);
      toast.error('Failed to load exam');
      navigate('/dashboard/my-exams');
    } finally {
      setLoading(false);
    }
  }, [examId, navigate, submitExam, user]);

  useEffect(() => {
    void initializeExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initializeExam]);

  useEffect(() => {
    if (!attemptId || attemptStatus !== 'in-progress') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void submitExam(attemptId, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptId, attemptStatus, submitExam]);

  function saveAnswer(questionId: string, value: string | number | boolean) {
    if (!attempt) return;

    const updatedAttempt = updateAttempt(attempt.id, {
      answers: {
        ...attempt.answers,
        [questionId]: value,
      },
    });

    if (updatedAttempt) {
      setAttempt(updatedAttempt);
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getTimerColor() {
    if (timeLeft <= 60) return 'text-exam-timer';
    if (timeLeft <= 300) return 'text-exam-timer-warning';
    return 'text-exam-timer-safe';
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!exam || !attempt || exam.questions.length === 0) {
    return null;
  }

  const currentQuestion = exam.questions[currentIndex];
  const currentAnswer = attempt.answers[currentQuestion.id];
  const answeredCount = exam.questions.filter((q) => isAnsweredValue(attempt.answers[q.id])).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-lg font-semibold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {exam.questions.length}
            </p>
          </div>
          <div className={cn('flex items-center gap-2 font-mono text-xl font-bold', getTimerColor())}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
            {timeLeft <= 300 && <AlertTriangle className="h-5 w-5 animate-pulse" />}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {answeredCount}/{exam.questions.length} answered
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Question {currentIndex + 1}</CardTitle>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                    {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg leading-relaxed">{currentQuestion.text}</p>

                {currentQuestion.type === 'mcq' && (
                  <RadioGroup
                    value={
                      currentQuestion.options?.find((option) => option.text === currentAnswer)?.id || ''
                    }
                    onValueChange={(value) => {
                      const selected = currentQuestion.options?.find((option) => option.id === value);
                      if (selected) {
                        saveAnswer(currentQuestion.id, selected.text);
                      }
                    }}
                    className="space-y-3"
                  >
                    {currentQuestion.options?.map((option) => (
                      <div
                        key={option.id}
                        className={cn(
                          'flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all',
                          currentAnswer === option.text
                            ? 'border-accent bg-accent/5'
                            : 'hover:border-muted-foreground/30'
                        )}
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'true_false' && (
                  <RadioGroup
                    value={
                      currentAnswer === true
                        ? 'true'
                        : currentAnswer === false
                          ? 'false'
                          : ''
                    }
                    onValueChange={(value) => saveAnswer(currentQuestion.id, value === 'true')}
                    className="space-y-3"
                  >
                    {TRUE_FALSE_OPTIONS.map((option) => {
                      const optionId = `${currentQuestion.id}-${option.id}`;
                      const isSelected =
                        (option.id === 'true' && currentAnswer === true) ||
                        (option.id === 'false' && currentAnswer === false);

                      return (
                        <div
                          key={option.id}
                          className={cn(
                            'flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all',
                            isSelected
                              ? 'border-accent bg-accent/5'
                              : 'hover:border-muted-foreground/30'
                          )}
                        >
                          <RadioGroupItem value={option.id} id={optionId} />
                          <Label htmlFor={optionId} className="flex-1 cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}

                {currentQuestion.type === 'integer' && (
                  <div className="space-y-2">
                    <Label>Your Answer</Label>
                    <Input
                      type="text"
                      placeholder="Enter your numeric answer"
                      value={currentAnswer !== undefined ? String(currentAnswer) : ''}
                      onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentIndex === exam.questions.length - 1 ? (
                <Button onClick={() => setShowSubmitDialog(true)} className="gradient-accent border-0">
                  <Send className="mr-2 h-4 w-4" />
                  Submit Exam
                </Button>
              ) : (
                <Button onClick={() => setCurrentIndex((prev) => prev + 1)}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {exam.questions.map((question, idx) => {
                    const isAnswered = isAnsweredValue(attempt.answers[question.id]);

                    return (
                      <button
                        key={question.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all',
                          idx === currentIndex && 'ring-2 ring-accent',
                          isAnswered
                            ? 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {isAnswered ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-success" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-muted" />
                    <span>Not answered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {exam.questions.length} questions.
              {answeredCount < exam.questions.length && (
                <span className="mt-2 block text-warning">
                  Warning: You have {exam.questions.length - answeredCount} unanswered question(s).
                </span>
              )}
              <span className="mt-2 block">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Continue Exam</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void submitExam(attempt.id)}
              disabled={submitting}
              className="gradient-accent border-0"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
