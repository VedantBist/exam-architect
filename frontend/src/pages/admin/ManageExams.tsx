import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getExams, deleteExam } from '@/lib/examStorage';
import { useAuth } from '@/lib/auth';
import { getBackendErrorMessage } from '@/lib/backendClient';

interface DisplayExam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: 'created' | 'active' | 'archived';
  passingPercentage: number;
  createdAt: string;
}

const statusColors = {
  created: 'bg-muted text-muted-foreground',
  active: 'bg-success/10 text-success',
  archived: 'bg-muted text-muted-foreground',
};

const statusIcons = {
  created: Clock,
  active: Play,
  archived: CheckCircle,
};

export default function ManageExams() {
  const [exams, setExams] = useState<DisplayExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    void fetchExams();
  }, []);

  async function fetchExams() {
    try {
      const allExams = await getExams();
      // Filter to show only exams created by this user
      const userExams = allExams.map(exam => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        status: exam.status,
        passingPercentage: exam.passingPercentage,
        createdAt: exam.createdAt,
      }));
      setExams(userExams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to load exams'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteExam(examId: string) {
    try {
      const success = await deleteExam(examId);
      if (success) {
        toast.success('Exam deleted');
        setExams(prev => prev.filter(e => e.id !== examId));
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to delete exam'));
    } finally {
      setDeleteExamId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Exams</h1>
            <p className="text-muted-foreground mt-1">Create and manage examination papers</p>
          </div>
          <Button asChild className="gradient-accent border-0">
            <Link to="/dashboard/exams/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Link>
          </Button>
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
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No exams yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first exam to get started
              </p>
              <Button asChild className="gradient-accent border-0">
                <Link to="/dashboard/exams/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exam
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => {
              const StatusIcon = statusIcons[exam.status];
              return (
                <Card key={exam.id} className="shadow-card hover:shadow-card-hover transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-1">{exam.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {exam.description || 'No description'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/exams/${exam.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/exams/${exam.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Exam
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteExamId(exam.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={statusColors[exam.status]}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {exam.durationMinutes} min
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created {format(new Date(exam.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pass: {exam.passingPercentage}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteExamId} onOpenChange={() => setDeleteExamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteExamId) {
                  await handleDeleteExam(deleteExamId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
