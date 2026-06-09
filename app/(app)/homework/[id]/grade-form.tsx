"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { applyFieldErrors } from "@/lib/utils/form";
import { gradeSubmissionSchema, type GradeSubmissionInput } from "@/lib/validators";
import { gradeSubmissionAction } from "../actions";

interface GradeFormProps {
  submissionId: string;
  homeworkId: string;
  defaultScore: number | null;
  defaultComment: string | null;
}

export function GradeForm({
  submissionId,
  homeworkId,
  defaultScore,
  defaultComment,
}: GradeFormProps) {
  const form = useForm<GradeSubmissionInput>({
    resolver: zodResolver(gradeSubmissionSchema),
    defaultValues: { score: defaultScore ?? 0, comment: defaultComment ?? "" },
  });

  async function onSubmit(values: GradeSubmissionInput) {
    const result = await gradeSubmissionAction(submissionId, homeworkId, values);
    if (result.success) {
      toast.success("Оценка сохранена");
      return;
    }
    applyFieldErrors(form.setError, result.fieldErrors);
    toast.error(result.error);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem className="w-24">
              <FormLabel>Балл</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={100} step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Комментарий</FormLabel>
              <FormControl>
                <Input placeholder="Необязательно" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton type="submit" size="sm" loading={form.formState.isSubmitting}>
          Сохранить
        </LoadingButton>
      </form>
    </Form>
  );
}
