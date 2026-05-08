import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Plus,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import {
  getAdminInsights,
  getExamStats,
  getStudentInsights,
  type AdminInsights,
  type StudentInsights,
} from '@/lib/examStorage';

interface DashboardStats {
  totalExams: number;
  activeExams: number;
  completedAttempts: number;
  pendingResults: number;
}

export default function Dashboard() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    activeExams: 0,
    completedAttempts: 0,
    pendingResults: 0,
  });
  const [adminInsights, setAdminInsights] = useState<AdminInsights | null>(null);
  const [studentInsights, setStudentInsights] = useState<StudentInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const examStats = await getExamStats();
      setStats({
        totalExams: examStats.totalExams,
        activeExams: examStats.activeExams,
        completedAttempts: examStats.submittedAttempts,
        pendingResults: 0,
      });

      if (role === 'admin') {
        const insights = await getAdminInsights();
        setAdminInsights(insights);
        setStudentInsights(null);
      } else if (role === 'student') {
        const insights = await getStudentInsights(user.id);
        setStudentInsights(insights);
        setAdminInsights(null);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [role, user]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats, role]);

  if (role === 'admin') {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage exams and monitor results</p>
            </div>
            <Button asChild className="gradient-accent border-0">
              <Link to="/dashboard/exams/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Exam
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalExams}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Exams</CardTitle>
                <Clock className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.activeExams}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Attempts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completedAttempts}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">
                  {adminInsights ? `${adminInsights.passRate.toFixed(1)}%` : '--'}
                </div>
              </CardContent>
            </Card>
          </div>

          {adminInsights && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  AI Insights Snapshot
                </CardTitle>
                <CardDescription>Real-time cohort patterns and suggested actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Hardest Exam</p>
                    <p className="mt-1 text-base font-semibold">
                      {adminInsights.hardestExams[0]?.examTitle ?? 'Not enough data'}
                    </p>
                    {adminInsights.hardestExams[0] && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Avg {adminInsights.hardestExams[0].averagePercentage.toFixed(1)}% across{' '}
                        {adminInsights.hardestExams[0].attempts} attempts
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">At-Risk Students</p>
                    <p className="mt-1 text-base font-semibold">{adminInsights.atRiskStudents.length}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Students with low average performance or declining trend
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {adminInsights.recommendations.map((item) => (
                    <p key={item} className="text-sm text-muted-foreground">
                      • {item}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for exam management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/dashboard/exams/create">
                    Create New Exam
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/dashboard/exams">
                    Manage All Exams
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/dashboard/results">
                    View Results
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <span className="flex items-center text-sm text-success">
                      <span className="mr-2 h-2 w-2 rounded-full bg-success" />
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Authentication</span>
                    <span className="flex items-center text-sm text-success">
                      <span className="mr-2 h-2 w-2 rounded-full bg-success" />
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Exam Engine</span>
                    <span className="flex items-center text-sm text-success">
                      <span className="mr-2 h-2 w-2 rounded-full bg-success" />
                      Ready
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Student Dashboard
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! View your exams and results</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Exams</CardTitle>
              <FileText className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalExams}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.completedAttempts}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">0</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start an exam or view your results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/dashboard/my-exams">
                Browse Available Exams
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/dashboard/my-results">
                View My Results
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {studentInsights && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                AI Performance Insights
              </CardTitle>
              <CardDescription>Personalized trend and recommendation summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Trend</p>
                  <p className="mt-1 text-base font-semibold capitalize">
                    {studentInsights.trend.replace('_', ' ')}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Predicted Next Score</p>
                  <p className="mt-1 text-base font-semibold">
                    {studentInsights.predictedNextPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Weakest Area</p>
                  <p className="mt-1 text-base font-semibold">
                    {studentInsights.weakestQuestionType?.type.replace('_', ' ') ?? 'Not enough data'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {studentInsights.recommendations.map((item) => (
                  <p key={item} className="text-sm text-muted-foreground">
                    • {item}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading && !studentInsights && (
          <p className="text-sm text-muted-foreground">Loading dashboard insights...</p>
        )}
      </div>
    </DashboardLayout>
  );
}
