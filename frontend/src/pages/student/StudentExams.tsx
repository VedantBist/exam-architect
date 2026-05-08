import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { getExams, getAttemptsByStudent } from '@/lib/examStorage';
import { getBackendErrorMessage } from '@/lib/backendClient';

interface DisplayExam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: 'created' | 'active' | 'archived';
  passingPercentage: number;
}

interface StudentAttemptDisplay {
  id: string;
  examId: string;
  status: 'in-progress' | 'submitted';
}

export default function StudentExams() {
  const [exams, setExams] = useState<DisplayExam[]>([]);
  const [attempts, setAttempts] = useState<StudentAttemptDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const activeExams = (await getExams())
          .filter((exam) => exam.status === 'active')
          .map((exam) => ({
            id: exam.id,
            title: exam.title,
            description: exam.description,
            durationMinutes: exam.durationMinutes,
            status: exam.status,
            passingPercentage: exam.passingPercentage,
          }));
        setExams(activeExams);

        const studentAttempts = (await getAttemptsByStudent(user.id)).map((attempt) => ({
          id: attempt.id,
          examId: attempt.examId,
          status: attempt.status,
        }));
        setAttempts(studentAttempts);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(getBackendErrorMessage(error, 'Failed to load exams'));
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [user]);

  function getAttemptForExam(examId: string) {
    return attempts.find(a => a.examId === examId);
  }

  function getExamAction(exam: DisplayExam) {
    const attempt = getAttemptForExam(exam.id);

    if (attempt) {
      if (attempt.status === 'in-progress') {
        return { label: 'Resume', variant: 'default' as const, disabled: false };
      }
      return { label: 'Completed', variant: 'outline' as const, disabled: true };
    }

    if (exam.status === 'active') {
      return { label: 'Start Exam', variant: 'default' as const, disabled: false };
    }

    return { label: 'Not Available', variant: 'outline' as const, disabled: true };
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Available Exams</h1>
          <p className="text-muted-foreground mt-1">Browse and take your exams</p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No exams available</h3>
              <p className="text-muted-foreground text-center">
                Check back later for new exams
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              const action = getExamAction(exam);
              const attempt = getAttemptForExam(exam.id);
              
              return (
                <Card key={exam.id} className="shadow-card hover:shadow-card-hover transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{exam.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {exam.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Badge className={exam.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                        {exam.status === 'active' ? (
                          <>
                            <Play className="mr-1 h-3 w-3" />
                            Live
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Scheduled
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {exam.durationMinutes} min
                      </div>
                      <div className="text-muted-foreground">
                        Pass: {exam.passingPercentage}%
                      </div>
                    </div>

                    {attempt && (
                      <div className="text-sm">
                        {attempt.status === 'in-progress' ? (
                          <span className="text-warning flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            In Progress
                          </span>
                        ) : (
                          <span className="text-success flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                      </div>
                    )}

                    <Button
                      asChild={!action.disabled}
                      variant={action.variant}
                      className={`w-full ${!action.disabled ? 'gradient-accent border-0' : ''}`}
                      disabled={action.disabled}
                    >
                      {action.disabled ? (
                        <span>{action.label}</span>
                      ) : (
                        <Link to={`/exam/${exam.id}`}>
                          {action.label}
                        </Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
