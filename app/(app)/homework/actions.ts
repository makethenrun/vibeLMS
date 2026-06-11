"use server";

import { revalidatePath } from "next/cache";

import { getStudentOrNull, getTutorOrNull } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import {
  fileSubmissionSchema,
  gradeSubmissionSchema,
  homeworkSchema,
  quizSubmissionSchema,
  type FileSubmissionInput,
  type GradeSubmissionInput,
  type HomeworkInput,
  type QuizSubmissionInput,
} from "@/lib/validators";
import { fail, getErrorMessage, ok, type ActionResult } from "@/lib/utils/action-result";
import {
  createHomework,
  deleteHomework,
  duplicateHomework,
  gradeSubmission,
  submitFileHomework,
  submitQuiz,
} from "@/services/homework/homework.service";

export async function createHomeworkAction(input: HomeworkInput): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = homeworkSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    // The same task can be assigned to several lessons/groups at once.
    for (const lessonId of parsed.data.lessonIds) {
      await createHomework(db, {
        lessonId,
        title: parsed.data.title,
        type: parsed.data.type,
        deadline: parsed.data.deadline,
        attachmentUrl: parsed.data.attachmentUrl,
        questions: parsed.data.questions,
      });
    }
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/homework");
  return ok();
}

export async function duplicateHomeworkAction(
  homeworkId: string,
  targetLessonId: string,
): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");
  if (!targetLessonId) return fail("Выберите занятие");

  const db = createServerSupabaseClient();
  try {
    await duplicateHomework(db, homeworkId, targetLessonId);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/homework");
  return ok();
}

export async function deleteHomeworkAction(id: string): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const db = createServerSupabaseClient();
  try {
    await deleteHomework(db, id);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath("/homework");
  return ok();
}

export async function gradeSubmissionAction(
  submissionId: string,
  homeworkId: string,
  input: GradeSubmissionInput,
): Promise<ActionResult> {
  const tutor = await getTutorOrNull();
  if (!tutor) return fail("Недостаточно прав");

  const parsed = gradeSubmissionSchema.safeParse(input);
  if (!parsed.success) return fail("Проверьте поля", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await gradeSubmission(db, submissionId, parsed.data);
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath(`/homework/${homeworkId}`);
  return ok();
}

export async function submitFileAction(
  homeworkId: string,
  input: FileSubmissionInput,
): Promise<ActionResult> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");

  const parsed = fileSubmissionSchema.safeParse(input);
  if (!parsed.success) return fail("Прикрепите файл", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    await submitFileHomework(db, {
      homeworkId,
      studentId: student.studentId,
      fileUrl: parsed.data.answer,
    });
  } catch (error) {
    return fail(getErrorMessage(error));
  }

  revalidatePath(`/homework/${homeworkId}`);
  revalidatePath("/homework");
  return ok();
}

export async function submitQuizAction(
  homeworkId: string,
  input: QuizSubmissionInput,
): Promise<ActionResult<{ score: number; results: boolean[] }>> {
  const student = await getStudentOrNull();
  if (!student) return fail("Недостаточно прав");

  const parsed = quizSubmissionSchema.safeParse(input);
  if (!parsed.success) return fail("Ответьте на вопросы", parsed.error.flatten().fieldErrors);

  const db = createServerSupabaseClient();
  try {
    const { score, results } = await submitQuiz(db, {
      homeworkId,
      studentId: student.studentId,
      answers: parsed.data.answers,
    });
    revalidatePath(`/homework/${homeworkId}`);
    revalidatePath("/homework");
    return ok({ score, results });
  } catch (error) {
    return fail(getErrorMessage(error));
  }
}
