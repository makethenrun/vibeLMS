"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { applyFieldErrors } from "@/lib/utils/form";
import { assistantSchema, assistantProfileSchema } from "@/lib/validators";
import type { AssistantRow } from "@/services/assistants/assistants.service";
import { createAssistantAction, updateAssistantAction } from "./actions";

interface FormValues {
  fullName: string;
  login: string;
  password: string;
  notes: string;
}

interface AssistantDialogProps {
  mode: "create" | "edit";
  assistant?: AssistantRow;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AssistantDialog({ mode, assistant, trigger, open, onOpenChange }: AssistantDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) onOpenChange?.(value);
    else setInternalOpen(value);
  };

  const [role, setRole] = useState<"ASSISTANT" | "ADMINISTRATOR">("ASSISTANT");

  const form = useForm<FormValues>({
    resolver: zodResolver(mode === "create" ? assistantSchema : assistantProfileSchema),
    defaultValues: { fullName: assistant?.fullName ?? "", login: "", password: "", notes: assistant?.notes ?? "" },
  });

  useEffect(() => {
    if (dialogOpen) {
      form.reset({ fullName: assistant?.fullName ?? "", login: "", password: "", notes: assistant?.notes ?? "" });
    }
  }, [dialogOpen, assistant, form]);

  async function onSubmit(values: FormValues) {
    const result =
      mode === "create"
        ? await createAssistantAction({ fullName: values.fullName, login: values.login, password: values.password, notes: values.notes }, role)
        : await updateAssistantAction(assistant!.id, { fullName: values.fullName, notes: values.notes });

    if (result.success) {
      toast.success(mode === "create" ? "Ассистент добавлен" : "Изменения сохранены");
      setOpen(false);
      router.refresh();
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
          <DialogTitle>{mode === "create" ? "Новый ассистент" : "Редактирование ассистента"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Ассистент сможет входить в систему по логину и паролю. Доступ к группам и материалам настраивается ниже."
              : "Измените данные ассистента. Логин и пароль меняются через «Обновить доступ»."}
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
            {mode === "create" ? (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Роль</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "ASSISTANT" | "ADMINISTRATOR")}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="ASSISTANT">Ассистент</option>
                    <option value="ADMINISTRATOR">Администратор</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {role === "ADMINISTRATOR"
                      ? "Видит всё, управляет доступом, но не редактирует материалы."
                      : "Видит только выданные группы и материалы."}
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="login"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Логин</FormLabel>
                      <FormControl>
                        <Input autoComplete="off" placeholder="assistant1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input type="text" autoComplete="off" {...field} />
                      </FormControl>
                      <FormDescription>Минимум 6 символов. Передайте ассистенту лично.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметки</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Роль, зона ответственности…" rows={4} {...field} value={field.value ?? ""} />
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
