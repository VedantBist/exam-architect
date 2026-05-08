import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, ListChecks, Target } from 'lucide-react';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import {
  getAttemptAnalysis,
  type AttemptAnalysis,
  type AttemptSubjectAnalysis,
} from '@/lib/examStorage';
import { getBackendErrorMessage, isResultsAnalysisEnabled } from '@/lib/backendClient';
import { toast } from 'sonner';

const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

function formatSeconds(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return 'N/A';
  }

  if (value < 60) {
    return `${value.toFixed(1)}s`;
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}m ${seconds}s`;
}

function hasTimingData(subjects: AttemptSubjectAnalysis[]): boolean {
  return subjects.some((subject) => subject.totalTimeSpentSeconds > 0);
}

export default function StudentResultDetail() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AttemptAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isResultsAnalysisEnabled()) {
      navigate('/dashboard/my-results', { replace: true });
      return;
    }

    async function fetchAnalysis() {
      if (!attemptId || !user) {
        setLoading(false);
        return;
      }

      try {
        const payload = await getAttemptAnalysis(attemptId, user.id);
        if (!payload) {
          toast.error('Result analysis not found');
          navigate('/dashboard/my-results');
          return;
        }
        setAnalysis(payload);
      } catch (error) {
        toast.error(getBackendErrorMessage(error, 'Failed to load detailed analysis'));
        navigate('/dashboard/my-results');
      } finally {
        setLoading(false);
      }
    }

    void fetchAnalysis();
  }, [attemptId, navigate, user]);

  const marksPieData = useMemo(
    () =>
      analysis?.subjects.map((subject) => ({
        name: subject.subject,
        value: subject.marksObtained,
      })) ?? [],
    [analysis]
  );

  const questionPieData = useMemo(
    () =>
      analysis?.subjects.map((subject) => ({
        name: subject.subject,
        value: subject.correctQuestions,
      })) ?? [],
    [analysis]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!analysis) {
    return null;
  }

  const timingAvailable = hasTimingData(analysis.subjects);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detailed Result Analysis</h1>
            <p className="mt-1 text-muted-foreground">{analysis.examTitle}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard/my-results">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Results
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Score</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {analysis.score}/{analysis.totalMarks}
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Percentage</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-accent">
              {analysis.percentage.toFixed(1)}%
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-success/10 text-success">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {analysis.status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-accent" />
                Marks Obtained by Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marksPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {marksPieData.map((item, index) => (
                      <Cell key={`marks-${item.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-accent" />
                Correct Questions by Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={questionPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {questionPieData.map((item, index) => (
                      <Cell key={`questions-${item.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock3 className="h-4 w-4 text-accent" />
              Section-wise Micro Analysis
            </CardTitle>
            {!timingAvailable && (
              <p className="text-sm text-muted-foreground">
                Timing metrics will appear for attempts made after this update.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.subjects.map((subject) => (
              <div key={subject.subject} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold">{subject.subject}</h3>
                  <Badge variant="secondary">
                    {subject.marksObtained}/{subject.totalMarks} marks
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Questions Attempted</p>
                    <p className="mt-1 text-lg font-semibold">
                      {subject.attemptedQuestions}/{subject.totalQuestions}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Correct / Wrong / Unattempted</p>
                    <p className="mt-1 text-lg font-semibold">
                      {subject.correctQuestions} / {subject.wrongQuestions} / {subject.unattemptedQuestions}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Marks Percentage</p>
                    <p className="mt-1 text-lg font-semibold">{subject.marksPercentage.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Total Time Spent</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatSeconds(subject.totalTimeSpentSeconds)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Avg Time per Question</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatSeconds(subject.avgTimePerQuestionSeconds)}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Avg Time per Attempted Question</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatSeconds(subject.avgTimePerAttemptedQuestionSeconds)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
