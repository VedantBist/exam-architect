import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Send,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  passing_percentage: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'integer';
  marks: number;
  order_index: number;
  correct_answer: string | null;
}

interface Option {
  id: string;
  question_id: string;
  option_text: string;
  order_index: number;
}

interface Answer {
  question_id: string;
  selected_option_id?: string;
  numeric_answer?: string;
}

interface ExamAttempt {
  id: string;
  server_deadline: string;
  status: 'in_progress' | 'submitted' | 'auto_submitted';
}

export default function TakeExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (examId && user) {
      initializeExam();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId, user]);

  async function initializeExam() {
    try {
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, title, duration_minutes, passing_percentage, status')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      if (examData.status !== 'active') {
        toast.error('This exam is not currently active');
        navigate('/dashboard/my-exams');
        return;
      }
      setExam(examData);

      // Check for existing attempt
      const { data: existingAttempt, error: attemptError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', user!.id)
        .maybeSingle();

      if (attemptError) throw attemptError;

      let currentAttempt = existingAttempt;

      if (existingAttempt) {
        if (existingAttempt.status !== 'in_progress') {
          toast.info('You have already completed this exam');
          navigate('/dashboard/my-results');
          return;
        }
        // Check if deadline has passed
        const deadline = new Date(existingAttempt.server_deadline);
        if (deadline < new Date()) {
          // Auto-submit
          await submitExam(existingAttempt.id, true);
          return;
        }
      } else {
        // Create new attempt
        const deadline = new Date();
        deadline.setMinutes(deadline.getMinutes() + examData.duration_minutes);

        const { data: newAttempt, error: createError } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: examId,
            student_id: user!.id,
            server_deadline: deadline.toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        currentAttempt = newAttempt;
      }

      setAttempt(currentAttempt);

      // Calculate time left
      const deadline = new Date(currentAttempt.server_deadline);
      const now = new Date();
      setTimeLeft(Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000)));

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Fetch options for all questions
      const questionIds = questionsData?.map(q => q.id) || [];
      if (questionIds.length > 0) {
        const { data: optionsData, error: optionsError } = await supabase
          .from('options')
          .select('*')
          .in('question_id', questionIds)
          .order('order_index');

        if (optionsError) throw optionsError;

        const optionsByQuestion: Record<string, Option[]> = {};
        optionsData?.forEach(opt => {
          if (!optionsByQuestion[opt.question_id]) {
            optionsByQuestion[opt.question_id] = [];
          }
          optionsByQuestion[opt.question_id].push(opt);
        });
        setOptions(optionsByQuestion);
      }

      // Load existing answers
      const { data: existingAnswers, error: answersError } = await supabase
        .from('answers')
        .select('question_id, selected_option_id, numeric_answer')
        .eq('attempt_id', currentAttempt.id);

      if (answersError) throw answersError;
      setAnswers(existingAnswers || []);

    } catch (error) {
      console.error('Error initializing exam:', error);
      toast.error('Failed to load exam');
      navigate('/dashboard/my-exams');
    } finally {
      setLoading(false);
    }
  }

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && attempt?.status === 'in_progress') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            submitExam(attempt.id, true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt?.id, attempt?.status]);

  async function saveAnswer(questionId: string, selectedOptionId?: string, numericAnswer?: string) {
    if (!attempt) return;

    try {
      const { error } = await supabase
        .from('answers')
        .upsert({
          attempt_id: attempt.id,
          question_id: questionId,
          selected_option_id: selectedOptionId || null,
          numeric_answer: numericAnswer || null,
          answered_at: new Date().toISOString(),
        }, {
          onConflict: 'attempt_id,question_id'
        });

      if (error) throw error;

      // Update local state
      setAnswers(prev => {
        const existing = prev.findIndex(a => a.question_id === questionId);
        const newAnswer: Answer = { question_id: questionId, selected_option_id: selectedOptionId, numeric_answer: numericAnswer };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newAnswer;
          return updated;
        }
        return [...prev, newAnswer];
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    }
  }

  async function submitExam(attemptId: string, isAutoSubmit = false) {
    setSubmitting(true);
    try {
      // Update attempt status
      const { error: updateError } = await supabase
        .from('exam_attempts')
        .update({
          status: isAutoSubmit ? 'auto_submitted' : 'submitted',
          end_time: new Date().toISOString(),
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Calculate results
      const { data: finalAnswers, error: answersError } = await supabase
        .from('answers')
        .select('question_id, selected_option_id, numeric_answer')
        .eq('attempt_id', attemptId);

      if (answersError) throw answersError;

      // Get all options to check correct answers
      const questionIds = questions.map(q => q.id);
      const { data: allOptions, error: optionsError } = await supabase
        .from('options')
        .select('id, question_id, is_correct')
        .in('question_id', questionIds);

      if (optionsError) throw optionsError;

      let totalMarks = 0;
      let obtainedMarks = 0;

      questions.forEach(question => {
        totalMarks += question.marks;
        const answer = finalAnswers?.find(a => a.question_id === question.id);

        if (answer) {
          if (question.question_type === 'integer') {
            if (answer.numeric_answer === question.correct_answer) {
              obtainedMarks += question.marks;
            }
          } else {
            const correctOption = allOptions?.find(o => o.question_id === question.id && o.is_correct);
            if (correctOption && answer.selected_option_id === correctOption.id) {
              obtainedMarks += question.marks;
            }
          }
        }
      });

      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
      const passed = percentage >= (exam?.passing_percentage || 40);

      // Insert result
      const { error: resultError } = await supabase
        .from('results')
        .insert({
          attempt_id: attemptId,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks,
          percentage: percentage,
          passed: passed,
        });

      if (resultError) throw resultError;

      toast.success(isAutoSubmit ? 'Time up! Exam auto-submitted' : 'Exam submitted successfully!');
      navigate('/dashboard/my-results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
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

  if (!exam || !attempt || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(a => a.question_id === currentQuestion.id);
  const answeredCount = answers.filter(a => a.selected_option_id || a.numeric_answer).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
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
          {/* Question Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{answeredCount}/{questions.length} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {currentIndex + 1}
                  </CardTitle>
                  <span className="text-sm font-medium px-3 py-1 rounded-full bg-accent/10 text-accent">
                    {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg leading-relaxed">{currentQuestion.question_text}</p>

                {/* MCQ / True-False Options */}
                {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'true_false') && (
                  <RadioGroup
                    value={currentAnswer?.selected_option_id || ''}
                    onValueChange={(value) => saveAnswer(currentQuestion.id, value)}
                    className="space-y-3"
                  >
                    {options[currentQuestion.id]?.map((option) => (
                      <div
                        key={option.id}
                        className={cn(
                          'flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all',
                          currentAnswer?.selected_option_id === option.id
                            ? 'border-accent bg-accent/5'
                            : 'hover:border-muted-foreground/30'
                        )}
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.option_text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Integer Answer */}
                {currentQuestion.question_type === 'integer' && (
                  <div className="space-y-2">
                    <Label>Your Answer</Label>
                    <Input
                      type="text"
                      placeholder="Enter your numeric answer"
                      value={currentAnswer?.numeric_answer || ''}
                      onChange={(e) => saveAnswer(currentQuestion.id, undefined, e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="gradient-accent border-0"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Exam
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = answers.some(
                      a => a.question_id === q.id && (a.selected_option_id || a.numeric_answer)
                    );
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                          'h-10 w-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center',
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
                <div className="mt-4 pt-4 border-t space-y-2 text-sm">
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

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-warning">
                  Warning: You have {questions.length - answeredCount} unanswered question(s).
                </span>
              )}
              <span className="block mt-2">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Continue Exam</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => attempt && submitExam(attempt.id)}
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
