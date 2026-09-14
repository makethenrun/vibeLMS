"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { LoadingButton } from "@/components/shared/loading-button";
import type { InfoContent, ItemContent } from "@/lib/validators";

interface EditorProps {
  content: InfoContent;
  onSave: (content: ItemContent) => Promise<void>;
}

export function InfoEditor({ content, onSave }: EditorProps) {
  const [doc, setDoc] = useState<Record<string, unknown>>(content.doc);
  const editorRef = useRef<Editor | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      // Read the live editor state so a just-applied mark (e.g. pinyin) is never
      // missed by a lagging React state update.
      const latest = (editorRef.current?.getJSON() as Record<string, unknown> | undefined) ?? doc;
      // TEMP DEBUG: show whether the pinyin value survives into the saved JSON.
      const s = JSON.stringify(latest);
      if (s.includes('"pinyin"')) {
        const hasValue = /"attrs":\{"pinyin":"[^"]+"/.test(s);
        const sample = (s.match(/\{"type":"pinyin"[^}]*\}\}?/g) || []).slice(0, 3).join("  ");
        window.alert(`DEBUG сохранение\nЗначение подписи в JSON: ${hasValue}\n${sample}`);
      }
      await onSave({ type: "INFO", doc: latest });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <RichTextEditor value={doc} onChange={setDoc} onReady={(e) => (editorRef.current = e)} />
      <LoadingButton size="sm" loading={saving} onClick={handleSave}>
        Сохранить
      </LoadingButton>
    </div>
  );
}
