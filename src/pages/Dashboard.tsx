import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Plus,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { getExamStats } from '@/lib/examStorage';

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
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
                <div className="text-3xl font-bold text-success">--</div>
              </CardContent>
            </Card>
          </div>

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
      </div>
    </DashboardLayout>
  );
}
