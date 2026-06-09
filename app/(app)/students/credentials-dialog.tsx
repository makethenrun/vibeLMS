"use client";

import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { applyFieldErrors } from "@/lib/utils/form";
import { credentialsSchema, type CredentialsInput } from "@/lib/validators";
import { issueCredentialsAction } from "./actions";

interface CredentialsDialogProps {
  studentId: string;
  hasAccount: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CredentialsDialog({
  studentId,
  hasAccount,
  open,
  onOpenChange,
}: CredentialsDialogProps) {
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { login: "", password: "" },
  });

  useEffect(() => {
    if (open) form.reset({ login: "", password: "" });
  }, [open, form]);

  async function onSubmit(values: CredentialsInput) {
    const result = await issueCredentialsAction(studentId, values);
    if (result.success) {
      toast.success(hasAccount ? "Доступ обновлён" : "Доступ выдан");
      onOpenChange(false);
      return;
    }
    applyFieldErrors(form.setError, result.fieldErrors);
    toast.error(result.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasAccount ? "Обновить доступ" : "Выдать доступ"}</DialogTitle>
          <DialogDescription>
            Ученик сможет входить в систему по этому логину и паролю.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="login"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Логин</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" placeholder="ivan.student" {...field} />
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
                  <FormDescription>Минимум 6 символов. Передайте ученику лично.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <LoadingButton type="submit" loading={form.formState.isSubmitting}>
                {hasAccount ? "Обновить" : "Выдать"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
