import "server-only";

import type { Db } from "@/lib/db/supabase";
import { getStudentGroupIds } from "@/services/groups/groups.service";
import type { GradeSubmissionInput } from "@/lib/validators";
import type {
  GradingMode,
  Homework,
  HomeworkListItem,
  HomeworkSubmission,
  HomeworkType,
  QuizAttemptSummary,
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

function normalizeUrls(urls: string[] | undefined): string[] {
  if (!urls) return [];
  const cleaned = urls.map((url) => url.trim()).filter((url) => url !== "");
  return [...new Set(cleaned)].slice(0, 5);
}

/**
 * Merges the new array column with the legacy single-value column so that
 * rows created before the multi-file migration keep working.
 */
export function mergeAttachmentUrls(
  urls: string[] | null,
  legacy: string | null,
): string[] {
  if (urls && urls.length > 0) return urls;
  return legacy ? [legacy] : [];
}

export interface GradableQuestion {
  correct_answer: string;
  correct_answers: string[] | null;
  options: string[] | null;
  grading: string;
}

/**
 * Parses a stored quiz answer into selected options per question.
 * Back-compatible with the old format (a flat array of strings).
 */
export function parseQuizAnswers(answer: string | null, count: number): string[][] {
  let parsed: unknown = null;
  if (answer) {
    try {
      parsed = JSON.parse(answer);
    } catch {
      parsed = null;
    }
  }
  const list = Array.isArray(parsed) ? parsed : [];
  return Array.from({ length: count }, (_, index) => {
    const value = list[index];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
    if (typeof value === "string") return value === "" ? [] : [value];
    return [];
  });
}

/** Grades one question against the selected answers — returns a 0..1 fraction. */
export function gradeQuestion(question: GradableQuestion, selected: string[]): number {
  const isChoice = (question.options?.length ?? 0) > 0;
  if (!isChoice) {
    const given = normalizeAnswer(selected[0] ?? "");
    return given !== "" && given === normalizeAnswer(question.correct_answer) ? 1 : 0;
  }

  const correctSource =
    question.correct_answers && question.correct_answers.length > 0
      ? question.correct_answers
      : [question.correct_answer];
  const correctSet = [...new Set(correctSource.map(normalizeAnswer).filter((value) => value !== ""))];
  if (correctSet.length === 0) return 0;

  const selectedSet = [...new Set(selected.map(normalizeAnswer).filter((value) => value !== ""))];
  const correctSelected = selectedSet.filter((value) => correctSet.includes(value)).length;
  const wrongSelected = selectedSet.length - correctSelected;

  if (question.grading === "PARTIAL") {
    return Math.max(0, correctSelected - wrongSelected) / correctSet.length;
  }
  return correctSelected === correctSet.length && wrongSelected === 0 ? 1 : 0;
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
  correctAnswers: string[];
  options: string[];
  grading: GradingMode;
}

export interface CreateHomeworkInput {
  lessonId: string;
  title: string;
  type: HomeworkType;
  deadline?: string;
  attachmentUrls?: string[];
  maxAttempts?: number | null;
  questions: CreateHomeworkQuestion[];
}

export async function createHomework(db: Db, input: CreateHomeworkInput): Promise<string> {
  const attachmentUrls = input.type === "FILE" ? normalizeUrls(input.attachmentUrls) : [];
  const { data: homework, error } = await db
    .from("homework")
    .insert({
      lesson_id: input.lessonId,
      title: input.title,
      type: input.type,
      deadline: normalizeDeadline(input.deadline),
      // Keep the first file in the legacy column for any single-value reader.
      attachment_url: attachmentUrls[0] ?? null,
      attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null,
      max_attempts: input.type === "QUIZ" ? (input.maxAttempts ?? null) : null,
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
      correct_answers: question.correctAnswers.length > 0 ? question.correctAnswers : null,
      grading: question.grading,
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
        .select("question, correct_answer, correct_answers, options, grading, position")
        .eq("quiz_id", quiz.id)
        .order("position", { ascending: true });
      questions = (rows ?? []).map((row) => ({
        question: row.question,
        correctAnswer: row.correct_answer,
        correctAnswers: row.correct_answers ?? [],
        options: row.options ?? [],
        grading: row.grading,
      }));
    }
  }

  return createHomework(db, {
    lessonId: targetLessonId,
    title: homework.title,
    type: homework.type,
    deadline: homework.deadline ?? undefined,
    attachmentUrls: mergeAttachmentUrls(homework.attachment_urls, homework.attachment_url),
    maxAttempts: homework.max_attempts,
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
  /** Per-question score fraction (0..1) of the existing submission (QUIZ only). */
  submissionResults: number[] | null;
  attempts: QuizAttemptSummary[];
  maxAttempts: number | null;
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
  // Correct answers/options are kept server-side (never sent to the student)
  // and are used only to compute per-question scores.
  let gradable: GradableQuestion[] = [];
  if (homework.type === "QUIZ") {
    const { data: quiz } = await db
      .from("quizzes")
      .select("id")
      .eq("homework_id", homework.id)
      .maybeSingle();
    if (quiz) {
      const { data: rows } = await db
        .from("quiz_questions")
        .select("id, question, position, options, correct_answer, correct_answers, grading")
        .eq("quiz_id", quiz.id)
        .order("position", { ascending: true });
      const list = rows ?? [];
      questions = list.map((row) => ({
        id: row.id,
        question: row.question,
        position: row.position,
        options: row.options,
      }));
      gradable = list.map((row) => ({
        correct_answer: row.correct_answer,
        correct_answers: row.correct_answers,
        options: row.options,
        grading: row.grading,
      }));
    }
  }

  const { data: submission } = await db
    .from("homework_submissions")
    .select("*")
    .eq("homework_id", homeworkId)
    .eq("student_id", studentId)
    .maybeSingle();

  let submissionResults: number[] | null = null;
  if (submission && homework.type === "QUIZ" && gradable.length > 0) {
    const studentAnswers = parseQuizAnswers(submission.answer, gradable.length);
    submissionResults = gradable.map((question, index) =>
      gradeQuestion(question, studentAnswers[index] ?? []),
    );
  }

  let attempts: QuizAttemptSummary[] = [];
  if (homework.type === "QUIZ") {
    const { data: attemptRows } = await db
      .from("quiz_attempts")
      .select("attempt_no, score, created_at")
      .eq("homework_id", homeworkId)
      .eq("student_id", studentId)
      .order("attempt_no", { ascending: true });
    attempts = (attemptRows ?? []).map((row) => ({
      attemptNo: row.attempt_no,
      score: row.score,
      createdAt: row.created_at,
    }));
  }

  return {
    homework,
    lessonTitle: lesson.title,
    groupName: group?.name ?? "—",
    questions,
    submission: submission ?? null,
    submissionResults,
    attempts,
    maxAttempts: homework.max_attempts,
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
  params: { homeworkId: string; studentId: string; fileUrls: string[] },
): Promise<void> {
  await assertStudentCanAccess(db, params.homeworkId, params.studentId);
  const fileUrls = normalizeUrls(params.fileUrls);
  if (fileUrls.length === 0) throw new Error("Прикрепите хотя бы один файл");
  const { error } = await db.from("homework_submissions").upsert(
    {
      homework_id: params.homeworkId,
      student_id: params.studentId,
      // Keep the first file in `answer` for back-compat; full list in the array.
      answer: fileUrls[0] ?? null,
      attachment_urls: fileUrls,
    },
    { onConflict: "homework_id,student_id" },
  );
  if (error) throw new Error(error.message);
}

export async function submitQuiz(
  db: Db,
  params: { homeworkId: string; studentId: string; answers: string[][] },
): Promise<{
  score: number;
  results: number[];
  attemptsUsed: number;
  maxAttempts: number | null;
}> {
  await assertStudentCanAccess(db, params.homeworkId, params.studentId);

  const homework = await getHomework(db, params.homeworkId);
  if (!homework) throw new Error("Задание не найдено");

  const { count } = await db
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("homework_id", params.homeworkId)
    .eq("student_id", params.studentId);
  const attemptsUsed = count ?? 0;
  if (homework.max_attempts !== null && attemptsUsed >= homework.max_attempts) {
    throw new Error("Достигнут лимит попыток");
  }

  const { data: quiz } = await db
    .from("quizzes")
    .select("id")
    .eq("homework_id", params.homeworkId)
    .maybeSingle();
  if (!quiz) throw new Error("Тест не найден");

  const { data: questions } = await db
    .from("quiz_questions")
    .select("id, correct_answer, correct_answers, options, grading, position")
    .eq("quiz_id", quiz.id)
    .order("position", { ascending: true });
  const questionList = questions ?? [];

  const results: number[] = questionList.map((question, index) =>
    gradeQuestion(question, params.answers[index] ?? []),
  );
  const totalFraction = results.reduce((sum, fraction) => sum + fraction, 0);
  const score =
    questionList.length > 0
      ? Math.round((totalFraction / questionList.length) * 10000) / 100
      : 0;

  const newAttemptNo = attemptsUsed + 1;
  const answersJson = JSON.stringify(params.answers);

  const { error: attemptError } = await db.from("quiz_attempts").insert({
    homework_id: params.homeworkId,
    student_id: params.studentId,
    attempt_no: newAttemptNo,
    answers: answersJson,
    score,
  });
  if (attemptError) throw new Error(attemptError.message);

  // Update the "current" submission (keeps status + any tutor comment intact).
  const { error } = await db.from("homework_submissions").upsert(
    {
      homework_id: params.homeworkId,
      student_id: params.studentId,
      answer: answersJson,
      score,
    },
    { onConflict: "homework_id,student_id" },
  );
  if (error) throw new Error(error.message);

  return { score, results, attemptsUsed: newAttemptNo, maxAttempts: homework.max_attempts };
}

export interface TutorQuizAttempt {
  studentId: string;
  attemptNo: number;
  score: number | null;
  createdAt: string;
  /** Raw stored answers (JSON), so the tutor can review each attempt. */
  answers: string | null;
}

/** All quiz attempts for a homework (tutor view), ordered by attempt number. */
export async function listQuizAttempts(db: Db, homeworkId: string): Promise<TutorQuizAttempt[]> {
  const { data } = await db
    .from("quiz_attempts")
    .select("student_id, attempt_no, score, created_at, answers")
    .eq("homework_id", homeworkId)
    .order("attempt_no", { ascending: true });
  return (data ?? []).map((row) => ({
    studentId: row.student_id,
    attemptNo: row.attempt_no,
    score: row.score,
    createdAt: row.created_at,
    answers: row.answers,
  }));
}
