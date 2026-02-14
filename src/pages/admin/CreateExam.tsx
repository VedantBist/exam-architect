import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2, Loader2, GripVertical, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { examTemplates } from '@/data/jeeTestData';
import { createExam } from '@/lib/examStorage';
import { getBackendErrorMessage } from '@/lib/backendClient';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['mcq', 'true_false', 'integer']),
  marks: z.number().min(1),
  correctAnswer: z.string().optional(),
  options: z.array(optionSchema).optional(),
});

const examSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute').max(480),
  passingPercentage: z.number().min(0).max(100),
  questions: z.array(questionSchema).min(1, 'Add at least one question'),
});

type ExamFormData = z.infer<typeof examSchema>;

const defaultQuestion = {
  text: '',
  type: 'mcq' as const,
  marks: 1,
  correctAnswer: '',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
};

export default function CreateExam() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      description: '',
      durationMinutes: 60,
      passingPercentage: 40,
      questions: [{ ...defaultQuestion }],
    },
  });

  const { fields: questions, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const loadTemplate = (templateKey: string) => {
    const template = examTemplates[templateKey];
    if (!template) return;

    setIsLoadingTemplate(true);
    
    // Reset form and load template data
    const formattedQuestions = template.questions.map(q => ({
      text: q.text,
      type: q.type,
      marks: q.marks,
      correctAnswer: q.type === 'mcq' ? '' : q.correctAnswer,
      options: q.options ? q.options.map(opt => ({
        text: opt,
        isCorrect: q.correctAnswer === `option_${q.options?.indexOf(opt)}`,
      })) : (q.type === 'true_false' ? [
        { text: 'True', isCorrect: q.correctAnswer === 'true' },
        { text: 'False', isCorrect: q.correctAnswer === 'false' },
      ] : undefined),
    }));

    form.reset({
      title: template.title,
      description: template.description,
      durationMinutes: template.durationMinutes,
      passingPercentage: template.passingPercentage,
      questions: formattedQuestions,
    });

    toast.success(`Loaded: ${template.title}`);
    setIsLoadingTemplate(false);
  };

  async function onSubmit(data: ExamFormData) {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Transform form data to exam storage format
      const examQuestions = data.questions.map((q, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        text: q.text,
        type: q.type as 'mcq' | 'true_false' | 'integer',
        marks: q.marks,
        orderIndex: idx,
        options: q.options
          ? q.options
              .filter(o => o.text.trim())
              .map((o, optIdx) => ({
                id: `opt-${Date.now()}-${idx}-${optIdx}`,
                text: o.text,
                isCorrect: o.isCorrect,
              }))
          : undefined,
        correctAnswer:
          q.type === 'integer'
            ? Number(q.correctAnswer) || 0
            : q.type === 'true_false'
              ? q.options?.find(o => o.isCorrect)?.text === 'True'
              : q.options?.find(o => o.isCorrect)?.text || '',
      }));

      // Create exam using localStorage
      await createExam({
        title: data.title,
        description: data.description || '',
        durationMinutes: data.durationMinutes,
        passingPercentage: data.passingPercentage,
        createdBy: user.id,
        status: 'created',
        questions: examQuestions,
      });

      toast.success('Exam created successfully!');
      navigate('/dashboard/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to create exam'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight">Create Exam</h1>
            <p className="text-muted-foreground mt-1">Design a new examination paper</p>
          </div>
        </div>

        {/* Quick Load Presets */}
        <Card className="shadow-card border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Quick Load JEE Templates
            </CardTitle>
            <CardDescription>Load a preset exam template to get started quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => loadTemplate('jeePhysics')}
                disabled={isLoadingTemplate}
                className="justify-start h-auto flex-col items-start p-3"
              >
                <span className="font-semibold">Physics</span>
                <span className="text-xs text-muted-foreground">8 questions</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => loadTemplate('jeeChemistry')}
                disabled={isLoadingTemplate}
                className="justify-start h-auto flex-col items-start p-3"
              >
                <span className="font-semibold">Chemistry</span>
                <span className="text-xs text-muted-foreground">8 questions</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => loadTemplate('jeeMathematics')}
                disabled={isLoadingTemplate}
                className="justify-start h-auto flex-col items-start p-3"
              >
                <span className="font-semibold">Mathematics</span>
                <span className="text-xs text-muted-foreground">8 questions</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => loadTemplate('jeeMainMock')}
                disabled={isLoadingTemplate}
                className="justify-start h-auto flex-col items-start p-3"
              >
                <span className="font-semibold">Full Mock Test</span>
                <span className="text-xs text-muted-foreground">9 questions</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exam Details */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>Basic information about the exam</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Midterm Examination - Computer Science 101"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter exam description or instructions..."
                rows={3}
                {...form.register('description')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={480}
                  {...form.register('durationMinutes', { valueAsNumber: true })}
                />
                {form.formState.errors.durationMinutes && (
                  <p className="text-sm text-destructive">{form.formState.errors.durationMinutes.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passing">Passing Percentage</Label>
                <Input
                  id="passing"
                  type="number"
                  min={0}
                  max={100}
                  {...form.register('passingPercentage', { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Add questions to your exam</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ ...defaultQuestion })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((field, index) => (
              <div key={field.id} className="relative rounded-lg border p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    Question {index + 1}
                  </span>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea
                    placeholder="Enter your question..."
                    {...form.register(`questions.${index}.text`)}
                  />
                  {form.formState.errors.questions?.[index]?.text && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.questions[index]?.text?.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={form.watch(`questions.${index}.type`)}
                      onValueChange={(value: 'mcq' | 'true_false' | 'integer') => {
                        form.setValue(`questions.${index}.type`, value);
                        if (value === 'true_false') {
                          form.setValue(`questions.${index}.options`, [
                            { text: 'True', isCorrect: false },
                            { text: 'False', isCorrect: false },
                          ]);
                        } else if (value === 'mcq') {
                          form.setValue(`questions.${index}.options`, [
                            { text: '', isCorrect: false },
                            { text: '', isCorrect: false },
                            { text: '', isCorrect: false },
                            { text: '', isCorrect: false },
                          ]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="integer">Integer Answer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      {...form.register(`questions.${index}.marks`, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Options for MCQ/True-False */}
                {(form.watch(`questions.${index}.type`) === 'mcq' || 
                  form.watch(`questions.${index}.type`) === 'true_false') && (
                  <div className="space-y-3">
                    <Label>Options (mark the correct one)</Label>
                    {form.watch(`questions.${index}.options`)?.map((_, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-3">
                        <Switch
                          checked={form.watch(`questions.${index}.options.${optIndex}.isCorrect`)}
                          onCheckedChange={(checked) => {
                            // Uncheck all others
                            const options = form.getValues(`questions.${index}.options`) || [];
                            options.forEach((_, i) => {
                              form.setValue(`questions.${index}.options.${i}.isCorrect`, i === optIndex ? checked : false);
                            });
                          }}
                        />
                        <Input
                          placeholder={`Option ${optIndex + 1}`}
                          {...form.register(`questions.${index}.options.${optIndex}.text`)}
                          disabled={form.watch(`questions.${index}.type`) === 'true_false'}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Integer Answer */}
                {form.watch(`questions.${index}.type`) === 'integer' && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Input
                      type="text"
                      placeholder="Enter the correct numeric answer"
                      {...form.register(`questions.${index}.correctAnswer`)}
                    />
                  </div>
                )}
              </div>
            ))}

            {form.formState.errors.questions && !Array.isArray(form.formState.errors.questions) && (
              <p className="text-sm text-destructive">{form.formState.errors.questions.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/exams')}
          >
            Cancel
          </Button>
          <Button type="submit" className="gradient-accent border-0" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Exam'
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
