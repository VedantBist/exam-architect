/**
 * Utility functions to seed JEE test data to Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { ExamTemplate, QuestionTemplate } from '@/data/jeeTestData';

interface SeedResult {
  success: boolean;
  examId?: string;
  message: string;
  error?: string;
}

/**
 * Seeds an exam template to Supabase with all its questions and options
 * @param template - The exam template to seed
 * @param userId - The admin user ID
 * @returns Result of the seeding operation
 */
export async function seedExamTemplate(
  template: ExamTemplate,
  userId: string
): Promise<SeedResult> {
  try {
    // 1. Create the exam
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .insert({
        title: template.title,
        description: template.description,
        duration_minutes: template.durationMinutes,
        passing_percentage: template.passingPercentage,
        created_by: userId,
        status: 'created',
      })
      .select()
      .single();

    if (examError || !examData) {
      return {
        success: false,
        message: 'Failed to create exam',
        error: examError?.message,
      };
    }

    const examId = examData.id;

    // 2. Create questions and options
    for (let qIndex = 0; qIndex < template.questions.length; qIndex++) {
      const questionTemplate = template.questions[qIndex];

      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert({
          exam_id: examId,
          question_text: questionTemplate.text,
          question_type: questionTemplate.type,
          marks: questionTemplate.marks,
          order_index: qIndex,
          correct_answer:
            questionTemplate.type === 'integer'
              ? questionTemplate.correctAnswer
              : questionTemplate.type === 'true_false'
                ? questionTemplate.correctAnswer
                : null,
        })
        .select()
        .single();

      if (questionError || !questionData) {
        console.error('Failed to create question:', questionError);
        continue;
      }

      const questionId = questionData.id;

      // Insert options if it's an MCQ
      if (
        questionTemplate.type === 'mcq' &&
        questionTemplate.options &&
        questionTemplate.options.length > 0
      ) {
        const options = questionTemplate.options.map((optionText, oIndex) => ({
          question_id: questionId,
          option_text: optionText,
          order_index: oIndex,
          is_correct: questionTemplate.correctAnswer === `option_${oIndex}`,
        }));

        const { error: optionsError } = await supabase
          .from('options')
          .insert(options);

        if (optionsError) {
          console.error('Failed to create options:', optionsError);
        }
      }
    }

    return {
      success: true,
      examId,
      message: `Exam "${template.title}" created successfully with ${template.questions.length} questions`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error seeding exam template',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Seed multiple exam templates at once
 * @param templates - Array of exam templates to seed
 * @param userId - The admin user ID
 * @returns Array of seed results
 */
export async function seedMultipleExams(
  templates: ExamTemplate[],
  userId: string
): Promise<SeedResult[]> {
  const results: SeedResult[] = [];

  for (const template of templates) {
    const result = await seedExamTemplate(template, userId);
    results.push(result);
  }

  return results;
}
