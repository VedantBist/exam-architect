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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  status: 'created' | 'scheduled' | 'active' | 'closed';
  start_time: string | null;
  end_time: string | null;
  passing_percentage: number;
  created_at: string;
}

const statusColors = {
  created: 'bg-muted text-muted-foreground',
  scheduled: 'bg-warning/10 text-warning',
  active: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

const statusIcons = {
  created: Clock,
  scheduled: Clock,
  active: Play,
  closed: CheckCircle,
};

export default function ManageExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteExamId, setDeleteExamId] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  async function fetchExams() {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }

  async function updateExamStatus(examId: string, newStatus: Exam['status']) {
    try {
      const updateData: { status: 'created' | 'scheduled' | 'active' | 'closed'; start_time?: string; end_time?: string } = { status: newStatus };
      
      if (newStatus === 'active') {
        updateData.start_time = new Date().toISOString();
      } else if (newStatus === 'closed') {
        updateData.end_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('exams')
        .update(updateData)
        .eq('id', examId);

      if (error) throw error;
      
      toast.success(`Exam ${newStatus === 'active' ? 'activated' : newStatus}`);
      fetchExams();
    } catch (error) {
      console.error('Error updating exam:', error);
      toast.error('Failed to update exam');
    }
  }

  async function deleteExam(examId: string) {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
      
      toast.success('Exam deleted');
      setExams(exams.filter(e => e.id !== examId));
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
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
                          {exam.status === 'created' && (
                            <DropdownMenuItem onClick={() => updateExamStatus(exam.id, 'active')}>
                              <Play className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {exam.status === 'active' && (
                            <DropdownMenuItem onClick={() => updateExamStatus(exam.id, 'closed')}>
                              <Pause className="mr-2 h-4 w-4" />
                              Close Exam
                            </DropdownMenuItem>
                          )}
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
                          {exam.duration_minutes} min
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created {format(new Date(exam.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pass: {exam.passing_percentage}%
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
              Are you sure you want to delete this exam? This action cannot be undone and will also delete all questions and attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteExamId && deleteExam(deleteExamId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
