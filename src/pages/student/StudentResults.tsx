import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import { getAttemptsByStudent, getExamById } from '@/lib/examStorage';

interface DisplayResult {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export default function StudentResults() {
  const [results, setResults] = useState<DisplayResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  function fetchResults() {
    try {
      if (!user) return;
      
      const attempts = getAttemptsByStudent(user.id);
      const displayResults = attempts
        .filter(a => a.status === 'submitted' && a.submittedAt)
        .map(a => {
          const exam = getExamById(a.examId);
          return {
            id: a.id,
            examId: a.examId,
            examTitle: exam?.title || 'Unknown Exam',
            score: a.score,
            totalMarks: a.totalMarks,
            percentage: a.percentage,
            passed: a.percentage >= (exam?.passingPercentage || 40),
            submittedAt: a.submittedAt!,
          };
        });
      
      setResults(displayResults);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  }

  const averageScore = results.length > 0
    ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
    : 0;

  const passRate = results.length > 0
    ? (results.filter(r => r.passed).length / results.length) * 100
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Results</h1>
          <p className="text-muted-foreground mt-1">View your examination results and performance</p>
        </div>

        {/* Stats Overview */}
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

        {/* Results List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No results yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Complete an exam to see your results here
              </p>
              <Link to="/dashboard/my-exams" className="text-accent hover:underline">
                Browse available exams →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((result) => {
              const exam = result.exam_attempts.exams;
              const attempt = result.exam_attempts;

              return (
                <Card key={result.id} className="shadow-card hover:shadow-card-hover transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{result.examTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          Completed {format(new Date(result.submittedAt), 'MMM d, yyyy \'at\' h:mm a')}
                        </p>
                      </div>

                      <div className="flex flex-col md:items-end gap-3">
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Score</p>
                            <p className="text-2xl font-bold">
                              {result.score}/{result.totalMarks}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Percentage</p>
                            <p className={`text-2xl font-bold ${result.passed ? 'text-success' : 'text-destructive'}`}>
                              {result.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <Badge className={result.passed ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>
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

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress to pass ({exam.passing_percentage}%)</span>
                        <span className="font-medium">{result.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (result.percentage / exam.passing_percentage) * 100)} 
                        className={`h-2 ${result.passed ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
                      />
                    </div>
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
