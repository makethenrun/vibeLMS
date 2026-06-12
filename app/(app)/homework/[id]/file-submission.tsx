"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { MultiFileUpload } from "@/components/shared/multi-file-upload";
import { LoadingButton } from "@/components/shared/loading-button";
import { submitFileAction } from "../actions";

export function FileSubmission({
  homeworkId,
  currentUrls,
}: {
  homeworkId: string;
  currentUrls: string[];
}) {
  const router = useRouter();
  const [urls, setUrls] = useState<string[]>(currentUrls);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (urls.length === 0) {
      toast.error("Сначала прикрепите файл с решением");
      return;
    }
    startTransition(async () => {
      const result = await submitFileAction(homeworkId, { fileUrls: urls });
      if (result.success) {
        toast.success("Решение отправлено");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <MultiFileUpload folder="submissions" value={urls} onChange={setUrls} max={5} />
      <LoadingButton onClick={submit} loading={isPending} disabled={urls.length === 0}>
        Отправить решение
      </LoadingButton>
    </div>
  );
}
