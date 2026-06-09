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
import { LoadingButton } from "@/components/shared/loading-button";
import { HOMEWORK_TYPE_LABELS } from "@/lib/constants";
import { applyFieldErrors } from "@/lib/utils/form";
import { homeworkSchema, type HomeworkInput } from "@/lib/validators";
import { createHomeworkAction } from "./actions";

interface LessonOption {
  id: string;
  label: string;
}

const DEFAULTS: HomeworkInput = {
  lessonId: "",
  title: "",
  type: "FILE",
  deadline: "",
  questions: [],
};

export function HomeworkDialog({
  lessons,
  trigger,
}: {
  lessons: LessonOption[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<HomeworkInput>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: DEFAULTS,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "questions" });
  const type = form.watch("type");

  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, form]);

  useEffect(() => {
    if (type === "QUIZ" && fields.length === 0) {
      append({ question: "", correctAnswer: "" });
    }
  }, [type, fields.length, append]);

  async function onSubmit(values: HomeworkInput) {
    const payload: HomeworkInput =
      values.type === "FILE" ? { ...values, questions: [] } : values;
    const result = await createHomeworkAction(payload);
    if (result.success) {
      toast.success("Задание создано");
      setOpen(false);
      return;
    }
    applyFieldErrors(form.setError, result.fieldErrors);
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
              name="lessonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Занятие</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите занятие" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <div className="grid grid-cols-2 gap-3">
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
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дедлайн</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {type === "QUIZ" ? (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Вопросы теста</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ question: "", correctAnswer: "" })}
                  >
                    <Plus className="h-4 w-4" />
                    Вопрос
                  </Button>
                </div>
                {questionsMessage ? (
                  <p className="text-sm font-medium text-destructive">{questionsMessage}</p>
                ) : null}
                {fields.map((fieldItem, index) => (
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
                      name={`questions.${index}.correctAnswer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Правильный ответ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
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
