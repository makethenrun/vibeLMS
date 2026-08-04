"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
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
import { dictionaryEntrySchema, type DictionaryEntryInput } from "@/lib/validators";
import type { DictionaryEntry } from "@/types";
import { createEntryAction, updateEntryAction } from "./actions";

export function EntryDialog({ trigger, entry }: { trigger: ReactNode; entry?: DictionaryEntry }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(entry);

  const form = useForm<DictionaryEntryInput>({
    resolver: zodResolver(dictionaryEntrySchema),
    defaultValues: { term: "", translation: "", pinyin: "", note: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        term: entry?.term ?? "",
        translation: entry?.translation ?? "",
        pinyin: entry?.pinyin ?? "",
        note: entry?.note ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: DictionaryEntryInput) {
    const result = isEdit ? await updateEntryAction(entry!.id, values) : await createEntryAction(values);
    if (result.success) {
      toast.success(isEdit ? "Сохранено" : "Добавлено");
      setOpen(false);
      router.refresh();
      return;
    }
    applyFieldErrors(form.setError, result.fieldErrors);
    toast.error(result.error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать слово" : "Новое слово"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="term" render={({ field }) => (
              <FormItem>
                <FormLabel>Слово</FormLabel>
                <FormControl><Input placeholder="谢谢" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="pinyin" render={({ field }) => (
              <FormItem>
                <FormLabel>Пиньинь (необязательно)</FormLabel>
                <FormControl><Input placeholder="xièxie" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="translation" render={({ field }) => (
              <FormItem>
                <FormLabel>Перевод</FormLabel>
                <FormControl><Input placeholder="спасибо" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem>
                <FormLabel>Заметка (необязательно)</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Пример, контекст…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
              <LoadingButton type="submit" loading={form.formState.isSubmitting}>
                {isEdit ? "Сохранить" : "Добавить"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
