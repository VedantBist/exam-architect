import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth';
import { seedExamTemplate, seedMultipleExams } from '@/lib/seedExams';
import { examTemplates } from '@/data/jeeTestData';
import { toast } from 'sonner';

interface SeedStatus {
  templateKey: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  examId?: string;
}

export default function SeedExams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seedStatus, setSeedStatus] = useState<Record<string, SeedStatus>>({});
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedTemplate = async (templateKey: string) => {
    if (!user) {
      toast.error('You must be logged in as an admin');
      return;
    }

    setSeedStatus(prev => ({
      ...prev,
      [templateKey]: { templateKey, status: 'loading' }
    }));

    try {
      const template = examTemplates[templateKey];
      if (!template) {
        throw new Error('Template not found');
      }

      const result = await seedExamTemplate(template, user.id);

      if (result.success) {
        setSeedStatus(prev => ({
          ...prev,
          [templateKey]: {
            templateKey,
            status: 'success',
            message: result.message,
            examId: result.examId,
          }
        }));
        toast.success(result.message);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to seed exam';
      setSeedStatus(prev => ({
        ...prev,
        [templateKey]: {
          templateKey,
          status: 'error',
          message: errorMessage,
        }
      }));
      toast.error(errorMessage);
    }
  };

  const handleSeedAll = async () => {
    if (!user) {
      toast.error('You must be logged in as an admin');
      return;
    }

    setIsSeeding(true);
    try {
      const templates = Object.values(examTemplates);
      const results = await seedMultipleExams(templates, user.id);

      const successCount = results.filter(r => r.success).length;
      toast.success(`Seeded ${successCount}/${results.length} exams successfully`);

      // Update status for each result
      const newStatus: Record<string, SeedStatus> = {};
      Object.entries(examTemplates).forEach(([key], idx) => {
        const result = results[idx];
        newStatus[key] = {
          templateKey: key,
          status: result.success ? 'success' : 'error',
          message: result.message,
          examId: result.examId,
        };
      });
      setSeedStatus(newStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to seed exams';
      toast.error(errorMessage);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/exams')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seed JEE Test Exams</h1>
            <p className="text-muted-foreground mt-1">Load hardcoded JEE exam templates into the database</p>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            Use this page to quickly seed hardcoded JEE exam templates. Each template includes questions, options, and correct answers.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            onClick={handleSeedAll}
            disabled={isSeeding}
            className="gradient-accent border-0"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding All...
              </>
            ) : (
              'Seed All Exams'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/exams')}
          >
            Back to Exams
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {Object.entries(examTemplates).map(([key, template]) => {
            const status = seedStatus[key];
            return (
              <Card key={key} className={status?.status === 'success' ? 'border-green-200 bg-green-50' : status?.status === 'error' ? 'border-red-200 bg-red-50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <CardDescription>{template.questions.length} questions</CardDescription>
                    </div>
                    {status?.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                    )}
                    {status?.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-1" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  
                  <div className="text-sm space-y-1">
                    <div>Duration: <span className="font-medium">{template.durationMinutes} minutes</span></div>
                    <div>Passing: <span className="font-medium">{template.passingPercentage}%</span></div>
                  </div>

                  {status?.message && (
                    <Alert variant={status.status === 'error' ? 'destructive' : 'default'} className="text-xs">
                      <AlertDescription>{status.message}</AlertDescription>
                    </Alert>
                  )}

                  {!status || status.status === 'idle' ? (
                    <Button
                      onClick={() => handleSeedTemplate(key)}
                      variant="outline"
                      disabled={isSeeding}
                      className="w-full"
                    >
                      Load This Template
                    </Button>
                  ) : status.status === 'loading' ? (
                    <Button disabled className="w-full">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </Button>
                  ) : (
                    <Button disabled className="w-full" variant="outline">
                      {status.status === 'success' ? 'Loaded ✓' : 'Failed'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
