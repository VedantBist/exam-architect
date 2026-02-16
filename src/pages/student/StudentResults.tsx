import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, FileText, Sparkles, Trophy, TrendingUp, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth';
import { getAttemptsByStudent, getExamById, getStudentInsights, type StudentInsights } from '@/lib/examStorage';
import { toast } from 'sonner';
import { getBackendErrorMessage } from '@/lib/backendClient';

interface DisplayResult {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passingPercentage: number;
  submittedAt: string;
}

export default function StudentResults() {
  const [results, setResults] = useState<DisplayResult[]>([]);
  const [insights, setInsights] = useState<StudentInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchResults() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [attempts, aiInsights] = await Promise.all([
          getAttemptsByStudent(user.id),
          getStudentInsights(user.id),
        ]);

        const submittedAttempts = attempts
          .filter((attempt) => attempt.status === 'submitted' && attempt.submittedAt);

        const displayResults = await Promise.all(
          submittedAttempts.map(async (attempt) => {
            const exam = await getExamById(attempt.examId);
            const passingPercentage = exam?.passingPercentage ?? 40;

            return {
              id: attempt.id,
              examId: attempt.examId,
              examTitle: exam?.title ?? 'Unknown Exam',
              score: attempt.score,
              totalMarks: attempt.totalMarks,
              percentage: attempt.percentage,
              passed: attempt.percentage >= passingPercentage,
              passingPercentage,
              submittedAt: attempt.submittedAt!,
            };
          })
        );
        displayResults.sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

        setResults(displayResults);
        setInsights(aiInsights);
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error(getBackendErrorMessage(error, 'Failed to load results'));
      } finally {
        setLoading(false);
      }
    }

    void fetchResults();
  }, [user]);

  const averageScore =
    results.length > 0 ? results.reduce((sum, result) => sum + result.percentage, 0) / results.length : 0;

  const passRate =
    results.length > 0 ? (results.filter((result) => result.passed).length / results.length) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Results</h1>
          <p className="mt-1 text-muted-foreground">View your examination results and performance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{results.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{averageScore.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
              <Trophy className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{passRate.toFixed(0)}%</div>
            </CardContent>
          </Card>
        </div>

        {insights && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4 text-accent" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <p className="mt-1 text-sm font-semibold capitalize">
                    {insights.trend.replace('_', ' ')}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Predicted Next</p>
                  <p className="mt-1 text-sm font-semibold">
                    {insights.predictedNextPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Strongest</p>
                  <p className="mt-1 text-sm font-semibold">
                    {insights.strongestQuestionType?.type.replace('_', ' ') ?? 'Not enough data'}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Weakest</p>
                  <p className="mt-1 text-sm font-semibold">
                    {insights.weakestQuestionType?.type.replace('_', ' ') ?? 'Not enough data'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {insights.recommendations.map((item) => (
                  <p key={item} className="text-sm text-muted-foreground">
                    • {item}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 rounded-full bg-muted p-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No results yet</h3>
              <p className="mb-4 text-center text-muted-foreground">
                Complete an exam to see your results here
              </p>
              <Link to="/dashboard/my-exams" className="text-accent hover:underline">
                Browse available exams →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id} className="shadow-card transition-all hover:shadow-card-hover">
                <CardContent className="p-6">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{result.examTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        Completed {format(new Date(result.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 md:items-end">
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="text-2xl font-bold">
                            {result.score}/{result.totalMarks}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Percentage</p>
                          <p
                            className={`text-2xl font-bold ${
                              result.passed ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {result.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          result.passed
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }
                      >
                        {result.passed ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Passed
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Progress to pass ({result.passingPercentage}%)
                      </span>
                      <span className="font-medium">{result.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={Math.min(100, (result.percentage / result.passingPercentage) * 100)}
                      className={`h-2 ${result.passed ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
