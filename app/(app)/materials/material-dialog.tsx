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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/shared/file-upload";
import { LoadingButton } from "@/components/shared/loading-button";
import { ACCEPTED_FILE_EXTENSIONS, MATERIAL_TYPE_OPTIONS } from "@/lib/constants";
import { applyFieldErrors } from "@/lib/utils/form";
import { materialSchema, type MaterialInput } from "@/lib/validators";
import { createMaterialAction } from "./actions";

const DEFAULTS: MaterialInput = { title: "", materialType: "PDF", fileUrl: "" };

export function MaterialDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const form = useForm<MaterialInput>({
    resolver: zodResolver(materialSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, form]);

  const materialType = form.watch("materialType");
  const isLink = materialType === "VIDEO_LINK";
  const accept = materialType !== "VIDEO_LINK" ? ACCEPTED_FILE_EXTENSIONS[materialType] : undefined;

  async function onSubmit(values: MaterialInput) {
    const result = await createMaterialAction(values);
    if (result.success) {
      toast.success("Материал добавлен");
      setOpen(false);
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
          <DialogTitle>Новый материал</DialogTitle>
          <DialogDescription>Загрузите файл или добавьте ссылку на видео.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Грамматика: Present Simple" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="materialType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("fileUrl", "", { shouldValidate: false });
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MATERIAL_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isLink ? "Ссылка на видео" : "Файл"}</FormLabel>
                  {isLink ? (
                    <FormControl>
                      <Input placeholder="https://youtube.com/watch?v=…" {...field} />
                    </FormControl>
                  ) : (
                    <FileUpload
                      folder="materials"
                      accept={accept}
                      value={field.value || null}
                      onUploaded={(url) => field.onChange(url ?? "")}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <LoadingButton type="submit" loading={form.formState.isSubmitting}>
                Добавить
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
