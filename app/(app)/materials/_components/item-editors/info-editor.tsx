"use client";

import { useState } from "react";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { LoadingButton } from "@/components/shared/loading-button";
import type { InfoContent, ItemContent } from "@/lib/validators";

interface EditorProps {
  content: InfoContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function InfoEditor({ content, onSave }: EditorProps) {
  const [doc, setDoc] = useState<Record<string, unknown>>(content.doc);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ type: "INFO", doc });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <RichTextEditor value={doc} onChange={setDoc} />
      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
