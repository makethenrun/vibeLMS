"use client";

import { useRouter } from "next/navigation";
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
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { registerAction } from "../actions";

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { login: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterInput) {
    try {
      const result = await registerAction(values);
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      applyFieldErrors(form.setError, result.fieldErrors);
      toast.error(result.error);
    } catch {
      toast.error("Не удалось связаться с сервером. Попробуйте ещё раз.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="login"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Логин</FormLabel>
              <FormControl>
                <Input autoComplete="username" placeholder="ivan.tutor" {...field} />
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
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Повторите пароль</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <LoadingButton type="submit" className="w-full" loading={form.formState.isSubmitting}>
          Создать аккаунт
        </LoadingButton>
      </form>
    </Form>
  );
}
