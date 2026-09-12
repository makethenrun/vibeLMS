"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { applyFieldErrors } from "@/lib/utils/form";
import { settingsSchema, type SettingsInput } from "@/lib/validators";
import { EXTRA_KEYBOARDS } from "@/lib/keyboards";
import { updateSettingsAction } from "./actions";

export function SettingsForm({ defaults }: { defaults: SettingsInput }) {
  const router = useRouter();
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: SettingsInput) {
    const result = await updateSettingsAction(values);
    if (result.success) {
      toast.success("Настройки сохранены");
      router.refresh();
      return;
    }
    applyFieldErrors(form.setError, result.fieldErrors);
    toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Организация</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Моя школа" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Логотип (URL)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/logo.png"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Ссылка на изображение, которое будет показано в боковой панели.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enabledKeyboards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Дополнительные клавиатуры</FormLabel>
                  <div className="space-y-1">
                    {EXTRA_KEYBOARDS.map((kb) => {
                      const enabled = (field.value ?? []).includes(kb.id);
                      return (
                        <label key={kb.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => {
                              const current = field.value ?? [];
                              field.onChange(e.target.checked ? [...current, kb.id] : current.filter((id) => id !== kb.id));
                            }}
                          />
                          {kb.label}
                        </label>
                      );
                    })}
                  </div>
                  <FormDescription>Кнопка доп. клавиатуры и выбор конкретной появятся, если включена хотя бы одна.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoadingButton type="submit" loading={form.formState.isSubmitting}>
              Сохранить
            </LoadingButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
