"use client";

import { useEffect } from "react";
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
import { issueAssistantCredentialsAction } from "./actions";

interface Props {
  assistantId: string;
  currentLogin: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistantCredentialsDialog({ assistantId, currentLogin, open, onOpenChange }: Props) {
  const router = useRouter();
  const form = useForm<CredentialsInput>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { login: currentLogin, password: "" },
  });

  useEffect(() => {
    if (open) form.reset({ login: currentLogin, password: "" });
  }, [open, currentLogin, form]);

  async function onSubmit(values: CredentialsInput) {
    const result = await issueAssistantCredentialsAction(assistantId, values);
    if (result.success) {
      toast.success("Доступ обновлён");
      onOpenChange(false);
      router.refresh();
      return;
    }
    applyFieldErrors(form.setError, result.fieldErrors);
    toast.error(result.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Обновить доступ</DialogTitle>
          <DialogDescription>Ассистент будет входить в систему по этому логину и паролю.</DialogDescription>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <LoadingButton type="submit" loading={form.formState.isSubmitting}>
                Обновить
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
