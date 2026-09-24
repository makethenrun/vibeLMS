"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/shared/loading-button";
import { applyFieldErrors } from "@/lib/utils/form";
import { settingsSchema, type SettingsInput } from "@/lib/validators";
import { EXTRA_KEYBOARDS } from "@/lib/keyboards";
import { updateSettingsAction } from "./actions";

export function SettingsForm({ defaults }: { defaults: SettingsInput }) {
  const router = useRouter();
  const [newLang, setNewLang] = useState("");
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
            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => {
                const list = field.value ?? [];
                const add = () => {
                  const v = newLang.trim();
                  if (!v || list.some((l) => l.toLowerCase() === v.toLowerCase())) {
                    setNewLang("");
                    return;
                  }
                  field.onChange([...list, v]);
                  setNewLang("");
                };
                return (
                  <FormItem>
                    <FormLabel>Языки изучения</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={newLang}
                        onChange={(e) => setNewLang(e.target.value)}
                        placeholder="Например: Английский"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={add}>
                        <Plus className="h-4 w-4" />
                        Добавить
                      </Button>
                    </div>
                    {list.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {list.map((l) => (
                          <span key={l} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm">
                            {l}
                            <button
                              type="button"
                              onClick={() => field.onChange(list.filter((x) => x !== l))}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Удалить ${l}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <FormDescription>Эти языки можно выбрать как «язык изучения» на странице материала.</FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
