"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiFileUpload } from "@/components/shared/multi-file-upload";
import { LoadingButton } from "@/components/shared/loading-button";
import { HOMEWORK_TYPE_LABELS } from "@/lib/constants";
import {
  homeworkFormSchema,
  type HomeworkFormInput,
  type HomeworkInput,
} from "@/lib/validators";
import { createHomeworkAction } from "./actions";

interface LessonOption {
  id: string;
  label: string;
}

interface MaterialOption {
  id: string;
  title: string;
  fileUrl: string;
}

const DEFAULTS: HomeworkFormInput = {
  lessonIds: [],
  title: "",
  type: "FILE",
  deadline: "",
  attachmentUrls: [],
  maxAttemptsText: "",
  questions: [],
};

const EMPTY_QUESTION = {
  question: "",
  kind: "TEXT" as const,
  correctText: "",
  optionsText: "",
  grading: "STRICT" as const,
};

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function toServerPayload(values: HomeworkFormInput): HomeworkInput {
  return {
    lessonIds: values.lessonIds,
    title: values.title,
    type: values.type,
    deadline: values.deadline,
    attachmentUrls: values.type === "FILE" ? values.attachmentUrls : [],
    questions:
      values.type === "QUIZ"
        ? values.questions.map((question) => {
            if (question.kind === "CHOICE") {
              const correctAnswers = splitLines(question.correctText);
              return {
                question: question.question,
                correctAnswer: correctAnswers[0] ?? "",
                correctAnswers,
                options: splitLines(question.optionsText),
                grading: question.grading,
              };
            }
            return {
              question: question.question,
              correctAnswer: question.correctText.trim(),
              correctAnswers: [],
              options: [],
              grading: question.grading,
            };
          })
        : [],
    maxAttempts:
      values.type === "QUIZ" && values.maxAttemptsText.trim() !== ""
        ? Number(values.maxAttemptsText)
        : null,
  };
}

export function HomeworkDialog({
  lessons,
  materials,
  trigger,
}: {
  lessons: LessonOption[];
  materials: MaterialOption[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<HomeworkFormInput>({
    resolver: zodResolver(homeworkFormSchema),
    defaultValues: DEFAULTS,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "questions" });
  const type = form.watch("type");
  const [hasDeadline, setHasDeadline] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset(DEFAULTS);
      setHasDeadline(false);
    }
  }, [open, form]);

  useEffect(() => {
    if (type === "QUIZ" && fields.length === 0) append({ ...EMPTY_QUESTION });
  }, [type, fields.length, append]);

  async function onSubmit(values: HomeworkFormInput) {
    const result = await createHomeworkAction(toServerPayload(values));
    if (result.success) {
      toast.success("Задание создано");
      setOpen(false);
      return;
    }
    toast.error(result.error);
  }

  const questionsError = form.formState.errors.questions;
  const questionsMessage =
    questionsError && typeof questionsError.message === "string" ? questionsError.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новое домашнее задание</DialogTitle>
          <DialogDescription>
            Прикрепите задание к занятию. Тип «Тест» проверяется автоматически.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="lessonIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Занятия / группы</FormLabel>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                    {lessons.map((lesson) => {
                      const checked = field.value.includes(lesson.id);
                      return (
                        <label
                          key={lesson.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0 accent-primary"
                            checked={checked}
                            onChange={(event) => {
                              if (event.target.checked) {
                                field.onChange([...field.value, lesson.id]);
                              } else {
                                field.onChange(field.value.filter((id) => id !== lesson.id));
                              }
                            }}
                          />
                          <span>{lesson.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Упражнения 1–5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FILE">{HOMEWORK_TYPE_LABELS.FILE}</SelectItem>
                      <SelectItem value="QUIZ">{HOMEWORK_TYPE_LABELS.QUIZ}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={hasDeadline}
                  onChange={(event) => {
                    setHasDeadline(event.target.checked);
                    if (!event.target.checked) form.setValue("deadline", "");
                  }}
                />
                Указать дедлайн
              </label>
              {hasDeadline ? (
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            {type === "FILE" ? (
              <FormField
                control={form.control}
                name="attachmentUrls"
                render={({ field }) => {
                  const urls = field.value;
                  const atMax = urls.length >= 5;
                  const addUrl = (url: string) => {
                    if (!url || urls.includes(url) || urls.length >= 5) return;
                    field.onChange([...urls, url]);
                  };
                  return (
                    <FormItem className="rounded-lg border p-3">
                      <FormLabel>Файлы задания (до 5, необязательно)</FormLabel>
                      {materials.length > 0 ? (
                        <Select value="" onValueChange={addUrl}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  atMax ? "Достигнут лимит (5)" : "Добавить из материалов"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem
                                key={material.id}
                                value={material.fileUrl}
                                disabled={atMax || urls.includes(material.fileUrl)}
                              >
                                {material.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}
                      <MultiFileUpload
                        folder="materials"
                        value={urls}
                        onChange={field.onChange}
                        max={5}
                      />
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            ) : null}

            {type === "QUIZ" ? (
              <div className="space-y-3 rounded-lg border p-3">
                <FormField
                  control={form.control}
                  name="maxAttemptsText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Максимум попыток</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          placeholder="Без ограничений"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Оставьте пустым — без ограничения попыток.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Вопросы теста</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ ...EMPTY_QUESTION })}
                  >
                    <Plus className="h-4 w-4" />
                    Вопрос
                  </Button>
                </div>
                {questionsMessage ? (
                  <p className="text-sm font-medium text-destructive">{questionsMessage}</p>
                ) : null}
                {fields.map((fieldItem, index) => {
                  const kind = form.watch(`questions.${index}.kind`);
                  return (
                    <div key={fieldItem.id} className="space-y-2 rounded-md bg-muted/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Вопрос {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`questions.${index}.question`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Текст вопроса" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`questions.${index}.kind`}
                        render={({ field }) => (
                          <FormItem>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="TEXT">Текстовый ответ</SelectItem>
                                <SelectItem value="CHOICE">Выбор варианта</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {kind === "CHOICE" ? (
                        <>
                          <FormField
                            control={form.control}
                            name={`questions.${index}.optionsText`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder={"Вариант 1\nВариант 2\nВариант 3"}
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>Варианты — по одному на строку.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`questions.${index}.correctText`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder={"Правильный вариант\n(можно несколько)"}
                                    rows={2}
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Правильные варианты — по одному на строку (точно как в списке).
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`questions.${index}.grading`}
                            render={({ field }) => (
                              <FormItem>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="STRICT">
                                      Строгая оценка (всё или ничего)
                                    </SelectItem>
                                    <SelectItem value="PARTIAL">Частичная оценка</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : (
                        <FormField
                          control={form.control}
                          name={`questions.${index}.correctText`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Правильный ответ" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <LoadingButton type="submit" loading={form.formState.isSubmitting}>
                Создать
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
