import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

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

  async function onSubmit(data: ExamFormData) {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Create exam
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: data.title,
          description: data.description || null,
          duration_minutes: data.durationMinutes,
          passing_percentage: data.passingPercentage,
          created_by: user.id,
          status: 'created',
        })
        .select()
        .single();

      if (examError) throw examError;

      // Create questions
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            exam_id: exam.id,
            question_text: q.text,
            question_type: q.type,
            marks: q.marks,
            order_index: i,
            correct_answer: q.type === 'integer' ? q.correctAnswer : null,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create options for MCQ and true/false
        if ((q.type === 'mcq' || q.type === 'true_false') && q.options) {
          const optionsToInsert = q.options
            .filter(o => o.text.trim())
            .map((o, idx) => ({
              question_id: question.id,
              option_text: o.text,
              is_correct: o.isCorrect,
              order_index: idx,
            }));

          if (optionsToInsert.length > 0) {
            const { error: optionsError } = await supabase
              .from('options')
              .insert(optionsToInsert);

            if (optionsError) throw optionsError;
          }
        }
      }

      toast.success('Exam created successfully!');
      navigate('/dashboard/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('Failed to create exam');
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
