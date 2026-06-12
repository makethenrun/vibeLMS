import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Download, Paperclip, X } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HOMEWORK_TYPE_LABELS } from "@/lib/constants";
import { getCurrentStudent } from "@/lib/auth/current-user";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { cn, formatDateTime } from "@/lib/utils";
import {
  getStudentHomeworkDetail,
  getTutorHomeworkDetail,
  gradeQuestion,
  listQuizAttempts,
  listSubmissions,
  mergeAttachmentUrls,
  parseQuizAnswers,
  type TutorQuizAttempt,
} from "@/services/homework/homework.service";
import type { QuizQuestion } from "@/types";
import { FileSubmission } from "./file-submission";
import { GradeForm } from "./grade-form";
import { QuizForm } from "./quiz-form";
import { TutorAttempts, type AttemptView } from "./tutor-attempts";

export const metadata: Metadata = { title: "Задание" };

function correctAnswerText(question: QuizQuestion): string {
  const isChoice = (question.options?.length ?? 0) > 0;
  if (!isChoice) return question.correct_answer;
  const correct =
    question.correct_answers && question.correct_answers.length > 0
      ? question.correct_answers
      : [question.correct_answer];
  return correct.join(", ");
}

/** Builds the per-attempt, per-question breakdown shown to the tutor. */
function buildAttemptViews(
  questions: QuizQuestion[],
  attempts: TutorQuizAttempt[],
): AttemptView[] {
  return attempts.map((attempt) => {
    const selected = parseQuizAnswers(attempt.answers, questions.length);
    return {
      attemptNo: attempt.attemptNo,
      score: attempt.score,
      createdAt: attempt.createdAt,
      breakdown: questions.map((question, index) => {
        const given = selected[index] ?? [];
        return {
          id: question.id,
          question: `${index + 1}. ${question.question}`,
          given: given.join(", "),
          fraction: gradeQuestion(question, given),
          correctText: correctAnswerText(question),
        };
      }),
    };
  });
}

/** A row of download links for one or more attached files. */
function FileLinks({ urls, single }: { urls: string[]; single: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url, index) => (
        <Button key={url} asChild size="sm" variant="outline">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" />
            {urls.length > 1 ? `Файл ${index + 1}` : single}
          </a>
        </Button>
      ))}
    </div>
  );
}

function AttachmentCard({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {urls.length > 1 ? "Файлы задания" : "Файл задания"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {urls.map((url, index) => (
          <Button key={url} asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Paperclip className="h-4 w-4" />
              {urls.length > 1 ? `Файл ${index + 1}` : "Скачать файл задания"}
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

/** Per-question score breakdown of a quiz submission (tutor view). */
function QuizBreakdown({ questions, answer }: { questions: QuizQuestion[]; answer: string | null }) {
  const studentAnswers = parseQuizAnswers(answer, questions.length);
  return (
    <div className="space-y-1.5">
      {questions.map((question, index) => {
        const selected = studentAnswers[index] ?? [];
        const fraction = gradeQuestion(question, selected);
        const full = fraction >= 1;
        const none = fraction <= 0;
        const percent = Math.round(fraction * 100);
        const given = selected.join(", ");
        return (
          <div
            key={question.id}
            className={cn(
              "rounded-md border p-2 text-sm",
              full
                ? "border-emerald-200 bg-emerald-50"
                : none
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">
                {index + 1}. {question.question}
              </p>
              {full ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : none ? (
                <X className="h-4 w-4 shrink-0 text-red-600" />
              ) : (
                <span className="shrink-0 text-xs font-semibold text-amber-600">{percent}%</span>
              )}
            </div>
            <p className="text-muted-foreground">Ответ ученика: {given || "—"}</p>
            {!full ? (
              <p className="text-muted-foreground">Правильно: {correctAnswerText(question)}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default async function HomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const db = createServerSupabaseClient();

  if (user.role === "TUTOR") {
    const detail = await getTutorHomeworkDetail(db, id);
    if (!detail) notFound();
    const submissions = await listSubmissions(db, id);
    const attempts = detail.homework.type === "QUIZ" ? await listQuizAttempts(db, id) : [];
    const attemptsByStudent = new Map<string, TutorQuizAttempt[]>();
    for (const attempt of attempts) {
      const list = attemptsByStudent.get(attempt.studentId) ?? [];
      list.push(attempt);
      attemptsByStudent.set(attempt.studentId, list);
    }

    const taskFiles = mergeAttachmentUrls(
      detail.homework.attachment_urls,
      detail.homework.attachment_url,
    );

    return (
      <div className="space-y-6">
        <PageHeader
          title={detail.homework.title}
          description={`${detail.lessonTitle} · ${detail.groupName}`}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={detail.homework.type === "QUIZ" ? "default" : "secondary"}>
            {HOMEWORK_TYPE_LABELS[detail.homework.type]}
          </Badge>
          {detail.homework.deadline ? (
            <Badge variant="outline">Дедлайн: {formatDateTime(detail.homework.deadline)}</Badge>
          ) : null}
        </div>

        {detail.homework.type === "FILE" ? <AttachmentCard urls={taskFiles} /> : null}

        {detail.homework.type === "QUIZ" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Вопросы и правильные ответы</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {detail.questions.map((question, index) => (
                  <li key={question.id} className="rounded-md bg-muted/40 p-3">
                    <p className="font-medium">
                      {index + 1}. {question.question}
                    </p>
                    {question.options && question.options.length > 0 ? (
                      <p className="text-muted-foreground">
                        Варианты: {question.options.join(", ")}
                      </p>
                    ) : null}
                    <p className="text-muted-foreground">
                      Правильный ответ: {correctAnswerText(question)}
                    </p>
                    {question.options && question.options.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Оценка: {question.grading === "PARTIAL" ? "частичная" : "строгая"}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ответы учеников ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока никто не сдал задание.</p>
            ) : (
              submissions.map((submission) => {
                const submissionFiles =
                  detail.homework.type === "FILE"
                    ? mergeAttachmentUrls(submission.attachment_urls, submission.answer)
                    : [];
                const attemptViews =
                  detail.homework.type === "QUIZ"
                    ? buildAttemptViews(
                        detail.questions,
                        attemptsByStudent.get(submission.student_id) ?? [],
                      )
                    : [];
                return (
                  <div key={submission.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{submission.studentName}</p>
                        <p className="text-xs text-muted-foreground">
                          Сдано: {formatDateTime(submission.submitted_at)}
                        </p>
                      </div>
                      {submission.score !== null ? (
                        <Badge variant="success">Балл: {submission.score}</Badge>
                      ) : (
                        <Badge variant="secondary">Не оценено</Badge>
                      )}
                    </div>

                    {detail.homework.type === "FILE" && submissionFiles.length > 0 ? (
                      <FileLinks urls={submissionFiles} single="Открыть решение" />
                    ) : null}

                    {detail.homework.type === "QUIZ" ? (
                      <QuizBreakdown questions={detail.questions} answer={submission.answer} />
                    ) : null}

                    {detail.homework.type === "QUIZ" ? (
                      <TutorAttempts attempts={attemptViews} />
                    ) : null}

                    <GradeForm
                      submissionId={submission.id}
                      homeworkId={detail.homework.id}
                      defaultScore={submission.score}
                      defaultComment={submission.comment}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = await getCurrentStudent();
  if (!student) notFound();
  const detail = await getStudentHomeworkDetail(db, id, student.studentId);
  if (!detail) notFound();

  const submission = detail.submission;
  const initialAnswers = parseQuizAnswers(submission?.answer ?? null, detail.questions.length);
  const taskFiles = mergeAttachmentUrls(
    detail.homework.attachment_urls,
    detail.homework.attachment_url,
  );
  const submittedFiles = mergeAttachmentUrls(
    submission?.attachment_urls ?? null,
    submission?.answer ?? null,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.homework.title}
        description={`${detail.lessonTitle} · ${detail.groupName}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={detail.homework.type === "QUIZ" ? "default" : "secondary"}>
          {HOMEWORK_TYPE_LABELS[detail.homework.type]}
        </Badge>
        {detail.homework.deadline ? (
          <Badge variant="outline">Дедлайн: {formatDateTime(detail.homework.deadline)}</Badge>
        ) : null}
      </div>

      {detail.homework.type === "FILE" ? <AttachmentCard urls={taskFiles} /> : null}

      {submission && submission.score !== null && detail.homework.type === "FILE" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Результат</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Оценка: <span className="font-semibold">{submission.score}</span>
            </p>
          </CardContent>
        </Card>
      ) : null}

      {submission?.comment ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Комментарий преподавателя</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">{submission.comment}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {detail.homework.type === "QUIZ" ? "Прохождение теста" : "Ваше решение"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {detail.homework.type === "QUIZ" ? (
            <QuizForm
              homeworkId={detail.homework.id}
              questions={detail.questions}
              initialAnswers={initialAnswers}
              lastScore={submission?.score ?? null}
              initialResults={detail.submissionResults}
              attempts={detail.attempts}
              maxAttempts={detail.maxAttempts}
            />
          ) : (
            <FileSubmission homeworkId={detail.homework.id} currentUrls={submittedFiles} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
