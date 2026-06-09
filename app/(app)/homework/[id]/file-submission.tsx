"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FileUpload } from "@/components/shared/file-upload";
import { LoadingButton } from "@/components/shared/loading-button";
import { submitFileAction } from "../actions";

export function FileSubmission({
  homeworkId,
  currentUrl,
}: {
  homeworkId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!url) {
      toast.error("Сначала загрузите файл с решением");
      return;
    }
    startTransition(async () => {
      const result = await submitFileAction(homeworkId, { answer: url });
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
      <FileUpload folder="submissions" value={url} onUploaded={setUrl} />
      <LoadingButton onClick={submit} loading={isPending} disabled={!url}>
        Отправить решение
      </LoadingButton>
    </div>
  );
}
