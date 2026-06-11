import "server-only";

import type { Db } from "@/lib/db/supabase";
import { getStudentGroupIds } from "@/services/groups/groups.service";
import type { GradeSubmissionInput } from "@/lib/validators";
import type {
  Homework,
  HomeworkListItem,
  HomeworkSubmission,
  HomeworkType,
  QuizQuestion,
  QuizQuestionForStudent,
  StudentHomeworkItem,
  SubmissionWithStudent,
} from "@/types";

function normalizeDeadline(deadline: string | undefined): string | null {
  if (!deadline || deadline.trim() === "") return null;
  return new Date(deadline).toISOString();
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return trimmed === "" ? null : trimmed;
}

/** Parses a stored quiz answer (JSON array) into a fixed-length string array. */
function parseStoredAnswers(answer: string | null, count: number): string[] {
  if (answer) {
    try {
      const parsed: unknown = JSON.parse(answer);
      if (Array.isArray(parsed)) {
        return Array.from({ length: count }, (_, index) => {
          const value = parsed[index];
          return typeof value === "string" ? value : "";
        });
      }
    } catch {
      // answer is not a JSON array — fall through to empty answers
    }
  }
  return Array.from({ length: count }, () => "");
}

export async function getHomework(db: Db, id: string): Promise<Homework | null> {
  const { data } = await db.from("homework").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listHomeworkForTutor(db: Db): Promise<HomeworkListItem[]> {
  const { data: homeworkRows, error } = await db
    .from("homework")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const homework = homeworkRows ?? [];
  if (homework.length === 0) return [];

  const lessonIds = [...new Set(homework.map((row) => row.lesson_id))];
  const { data: lessons } = await db
    .from("lessons")
    .select("id, title, group_id")
    .in("id", lessonIds);
  const lessonById = new Map((lessons ?? []).map((lesson) => [lesson.id, lesson] as const));

  const groupIds = [...new Set((lessons ?? []).map((lesson) => lesson.group_id))];
  const { data: groups } = await db.from("groups").select("id, name").in("id", groupIds);
  const groupNameById = new Map(
    (groups ?? []).map((group) => [group.id, group.name] as const),
  );

  const homeworkIds = homework.map((row) => row.id);
  const { data: submissions } = await db
    .from("homework_submissions")
    .select("homework_id")
    .in("homework_id", homeworkIds);
  const submissionCount = new Map<string, number>();
  for (const submission of submissions ?? []) {
    submissionCount.set(
      submission.homework_id,
      (submissionCount.get(submission.homework_id) ?? 0) + 1,
    );
  }

  return homework.map((row) => {
    const lesson = lessonById.get(row.lesson_id);
    const groupId = lesson?.group_id ?? "";
    return {
      ...row,
      lessonTitle: lesson?.title ?? "—",
      groupId,
      groupName: groupId ? (groupNameById.get(groupId) ?? "—") : "—",
      submissionCount: submissionCount.get(row.id) ?? 0,
    };
  });
}

export interface TutorHomeworkDetail {
  homework: Homework;
  lessonTitle: string;
  groupId: string;
  groupName: string;
  questions: QuizQuestion[];
}

export async function getTutorHomeworkDetail(
  db: Db,
  id: string,
): Promise<TutorHomeworkDetail | null> {
  const homework = await getHomework(db, id);
  if (!homework) return null;

  const { data: lesson } = await db
    .from("lessons")
    .select("id, title, group_id")
    .eq("id", homework.lesson_id)
    .maybeSingle();

  let groupName = "—";
  if (lesson) {
    const { data: group } = await db
      .from("groups")
      .select("name")
      .eq("id", lesson.group_id)
      .maybeSingle();
    groupName = group?.name ?? "—";
  }

  let questions: QuizQuestion[] = [];
  if (homework.type === "QUIZ") {
    const { data: quiz } = await db
      .from("quizzes")
      .select("id")
      .eq("homework_id", homework.id)
      .maybeSingle();
    if (quiz) {
      const { data: rows } = await db
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("position", { ascending: true });
      questions = rows ?? [];
    }
  }

  return {
    homework,
    lessonTitle: lesson?.title ?? "—",
    groupId: lesson?.group_id ?? "",
    groupName,
    questions,
  };
}

export interface CreateHomeworkQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
}

export interface CreateHomeworkInput {
  lessonId: string;
  title: string;
  type: HomeworkType;
  deadline?: string;
  attachmentUrl?: string;
  questions: CreateHomeworkQuestion[];
}

export async function createHomework(db: Db, input: CreateHomeworkInput): Promise<string> {
  const { data: homework, error } = await db
    .from("homework")
    .insert({
      lesson_id: input.lessonId,
      title: input.title,
      type: input.type,
      deadline: normalizeDeadline(input.deadline),
      attachment_url: input.type === "FILE" ? normalizeUrl(input.attachmentUrl) : null,
    })
    .select("id")
    .single();
  if (error || !homework) throw new Error(error?.message ?? "Не удалось создать задание");

  if (input.type === "QUIZ" && input.questions && input.questions.length > 0) {
    const { data: quiz, error: quizError } = await db
      .from("quizzes")
      .insert({ homework_id: homework.id })
      .select("id")
      .single();
    if (quizError || !quiz) throw new Error(quizError?.message ?? "Не удалось создать тест");

    const questionRows = input.questions.map((question, index) => ({
      quiz_id: quiz.id,
      question: question.question,
      correct_answer: question.correctAnswer,
      options: question.options.length > 0 ? question.options : null,
      position: index,
    }));
    const { error: questionsError } = await db.from("quiz_questions").insert(questionRows);
    if (questionsError) throw new Error(questionsError.message);
  }

  return homework.id;
}

/** Copies a homework (and its quiz questions) to another lesson. */
export async function duplicateHomework(
  db: Db,
  homeworkId: string,
  targetLessonId: string,
): Promise<string> {
  const homework = await getHomework(db, homeworkId);
  if (!homework) throw new Error("Задание не найдено");

  let questions: CreateHomeworkQuestion[] = [];
  if (homework.type === "QUIZ") {
    const { data: quiz } = await db
      .from("quizzes")
      .select("id")
      .eq("homework_id", homework.id)
      .maybeSingle();
    if (quiz) {
      const { data: rows } = await db
        .from("quiz_questions")
        .select("question, correct_answer, options, position")
        .eq("quiz_id", quiz.id)
        .order("position", { ascending: true });
      questions = (rows ?? []).map((row) => ({
        question: row.question,
        correctAnswer: row.correct_answer,
        options: row.options ?? [],
      }));
    }
  }

  return createHomework(db, {
    lessonId: targetLessonId,
    title: homework.title,
    type: homework.type,
    deadline: homework.deadline ?? undefined,
    attachmentUrl: homework.attachment_url ?? undefined,
    questions,
  });
}

export async function deleteHomework(db: Db, id: string): Promise<void> {
  const { error } = await db.from("homework").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listSubmissions(db: Db, homeworkId: string): Promise<SubmissionWithStudent[]> {
  const { data: submissions } = await db
    .from("homework_submissions")
    .select("*")
    .eq("homework_id", homeworkId)
    .order("submitted_at", { ascending: false });

  const rows = submissions ?? [];
  if (rows.length === 0) return [];

  const studentIds = [...new Set(rows.map((row) => row.student_id))];
  const { data: students } = await db
    .from("students")
    .select("id, full_name")
    .in("id", studentIds);
  const nameById = new Map(
    (students ?? []).map((student) => [student.id, student.full_name] as const),
  );

  return rows.map((row) => ({ ...row, studentName: nameById.get(row.student_id) ?? "—" }));
}

export async function gradeSubmission(
  db: Db,
  submissionId: string,
  input: GradeSubmissionInput,
): Promise<void> {
  const { error } = await db
    .from("homework_submissions")
    .update({
      score: input.score,
      comment: input.comment && input.comment.trim() !== "" ? input.comment.trim() : null,
    })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);
}

// --- Student-facing -------------------------------------------------------

export async function listHomeworkForStudent(
  db: Db,
  studentId: string,
): Promise<StudentHomeworkItem[]> {
  const groupIds = await getStudentGroupIds(db, studentId);
  if (groupIds.length === 0) return [];

  const { data: lessons } = await db
    .from("lessons")
    .select("id, title, group_id")
    .in("group_id", groupIds);
  const lessonList = lessons ?? [];
  if (lessonList.length === 0) return [];

  const lessonById = new Map(lessonList.map((lesson) => [lesson.id, lesson] as const));
  const lessonIds = lessonList.map((lesson) => lesson.id);

  const { data: homeworkRows } = await db
    .from("homework")
    .select("*")
    .in("lesson_id", lessonIds)
    .order("created_at", { ascending: false });
  const homework = homeworkRows ?? [];
  if (homework.length === 0) return [];

  const { data: groups } = await db.from("groups").select("id, name").in("id", groupIds);
  const groupNameById = new Map(
    (groups ?? []).map((group) => [group.id, group.name] as const),
  );

  const homeworkIds = homework.map((row) => row.id);
  const { data: submissions } = await db
    .from("homework_submissions")
    .select("*")
    .eq("student_id", studentId)
    .in("homework_id", homeworkIds);
  const submissionByHomework = new Map(
    (submissions ?? []).map((submission) => [submission.homework_id, submission] as const),
  );

  return homework.map((row) => {
    const lesson = lessonById.get(row.lesson_id);
    const groupId = lesson?.group_id ?? "";
    return {
      ...row,
      lessonTitle: lesson?.title ?? "—",
      groupName: groupId ? (groupNameById.get(groupId) ?? "—") : "—",
      submission: submissionByHomework.get(row.id) ?? null,
    };
  });
}

export interface StudentHomeworkDetail {
  homework: Homework;
  lessonTitle: string;
  groupName: string;
  questions: QuizQuestionForStudent[];
  submission: HomeworkSubmission | null;
  /** Per-question correctness of the existing submission (QUIZ only), else null. */
  submissionResults: boolean[] | null;
}

export async function getStudentHomeworkDetail(
  db: Db,
  homeworkId: string,
  studentId: string,
): Promise<StudentHomeworkDetail | null> {
  const homework = await getHomework(db, homeworkId);
  if (!homework) return null;

  const { data: lesson } = await db
    .from("lessons")
    .select("id, title, group_id")
    .eq("id", homework.lesson_id)
    .maybeSingle();
  if (!lesson) return null;

  // Access control: the homework must belong to one of the student's groups.
  const groupIds = await getStudentGroupIds(db, studentId);
  if (!groupIds.includes(lesson.group_id)) return null;

  const { data: group } = await db
    .from("groups")
    .select("name")
    .eq("id", lesson.group_id)
    .maybeSingle();

  let questions: QuizQuestionForStudent[] = [];
  // Correct answers are kept server-side (never sent to the student) and used
  // only to compute per-question correctness booleans.
  let correctAnswers: string[] = [];
  if (homework.type === "QUIZ") {
    const { data: quiz } = await db
      .from("quizzes")
      .select("id")
      .eq("homework_id", homework.id)
      .maybeSingle();
    if (quiz) {
      const { data: rows } = await db
        .from("quiz_questions")
        .select("id, question, position, options, correct_answer")
        .eq("quiz_id", quiz.id)
        .order("position", { ascending: true });
      const list = rows ?? [];
      questions = list.map((row) => ({
        id: row.id,
        question: row.question,
        position: row.position,
        options: row.options,
      }));
      correctAnswers = list.map((row) => row.correct_answer);
    }
  }

  const { data: submission } = await db
    .from("homework_submissions")
    .select("*")
    .eq("homework_id", homeworkId)
    .eq("student_id", studentId)
    .maybeSingle();

  let submissionResults: boolean[] | null = null;
  if (submission && homework.type === "QUIZ" && correctAnswers.length > 0) {
    const studentAnswers = parseStoredAnswers(submission.answer, correctAnswers.length);
    submissionResults = correctAnswers.map((correctAnswer, index) => {
      const answer = normalizeAnswer(studentAnswers[index] ?? "");
      return answer !== "" && answer === normalizeAnswer(correctAnswer);
    });
  }

  return {
    homework,
    lessonTitle: lesson.title,
    groupName: group?.name ?? "—",
    questions,
    submission: submission ?? null,
    submissionResults,
  };
}

/** Verifies a homework belongs to one of the student's groups. */
async function assertStudentCanAccess(
  db: Db,
  homeworkId: string,
  studentId: string,
): Promise<void> {
  const homework = await getHomework(db, homeworkId);
  if (!homework) throw new Error("Задание не найдено");
  const { data: lesson } = await db
    .from("lessons")
    .select("group_id")
    .eq("id", homework.lesson_id)
    .maybeSingle();
  if (!lesson) throw new Error("Занятие не найдено");
  const groupIds = await getStudentGroupIds(db, studentId);
  if (!groupIds.includes(lesson.group_id)) throw new Error("Нет доступа к этому заданию");
}

export async function submitFileHomework(
  db: Db,
  params: { homeworkId: string; studentId: string; fileUrl: string },
): Promise<void> {
  await assertStudentCanAccess(db, params.homeworkId, params.studentId);
  const { error } = await db.from("homework_submissions").upsert(
    { homework_id: params.homeworkId, student_id: params.studentId, answer: params.fileUrl },
    { onConflict: "homework_id,student_id" },
  );
  if (error) throw new Error(error.message);
}

export async function submitQuiz(
  db: Db,
  params: { homeworkId: string; studentId: string; answers: string[] },
): Promise<{ score: number; results: boolean[] }> {
  await assertStudentCanAccess(db, params.homeworkId, params.studentId);

  const { data: quiz } = await db
    .from("quizzes")
    .select("id")
    .eq("homework_id", params.homeworkId)
    .maybeSingle();
  if (!quiz) throw new Error("Тест не найден");

  const { data: questions } = await db
    .from("quiz_questions")
    .select("id, correct_answer, position")
    .eq("quiz_id", quiz.id)
    .order("position", { ascending: true });
  const questionList = questions ?? [];

  let correct = 0;
  const results: boolean[] = questionList.map((question, index) => {
    const answer = normalizeAnswer(params.answers[index] ?? "");
    const ok = answer !== "" && answer === normalizeAnswer(question.correct_answer);
    if (ok) correct += 1;
    return ok;
  });
  const score =
    questionList.length > 0
      ? Math.round((correct / questionList.length) * 10000) / 100
      : 0;

  const { error } = await db.from("homework_submissions").upsert(
    {
      homework_id: params.homeworkId,
      student_id: params.studentId,
      answer: JSON.stringify(params.answers),
      score,
      comment: null,
    },
    { onConflict: "homework_id,student_id" },
  );
  if (error) throw new Error(error.message);

  return { score, results };
}
