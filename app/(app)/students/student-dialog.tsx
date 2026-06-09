"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { applyFieldErrors } from "@/lib/utils/form";
import { studentSchema, type StudentInput } from "@/lib/validators";
import type { StudentWithAccount } from "@/types";
import { createStudentAction, updateStudentAction } from "./actions";

interface StudentDialogProps {
  mode: "create" | "edit";
  student?: StudentWithAccount;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StudentDialog({ mode, student, trigger, open, onOpenChange }: StudentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) onOpenChange?.(value);
    else setInternalOpen(value);
  };

  const form = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: { fullName: student?.full_name ?? "", notes: student?.notes ?? "" },
  });

  useEffect(() => {
    if (dialogOpen) {
      form.reset({ fullName: student?.full_name ?? "", notes: student?.notes ?? "" });
    }
  }, [dialogOpen, student, form]);

  async function onSubmit(values: StudentInput) {
    const result =
      mode === "create"
        ? await createStudentAction(values)
        : await updateStudentAction(student!.id, values);

    if (result.success) {
      toast.success(mode === "create" ? "Ученик добавлен" : "Изменения сохранены");
      setOpen(false);
      return;
    }
    applyFieldErrors(form.setError, result.fieldErrors);
    toast.error(result.error);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Новый ученик" : "Редактирование ученика"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Добавьте ученика. Доступ в систему можно выдать позже."
              : "Измените данные ученика."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ФИО</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Петров" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметки</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Цели, уровень, особенности…"
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <LoadingButton type="submit" loading={form.formState.isSubmitting}>
                {mode === "create" ? "Добавить" : "Сохранить"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
