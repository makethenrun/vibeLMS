"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Languages, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Pos {
  top: number;
  left: number;
  annotated: boolean;
}

/**
 * Floating "Добавить над" button that appears above a non-empty text selection
 * inside the rich-text editor (mirrors the "Добавить в словарь" mechanic).
 * Clicking it prompts for pinyin and annotates the selection with a ruby mark.
 */
export function PinyinSelection({ editor }: { editor: Editor }) {
  const [pos, setPos] = useState<Pos | null>(null);

  useEffect(() => {
    function update() {
      const { state, view } = editor;
      const { from, to, empty } = state.selection;
      const text = state.doc.textBetween(from, to, "\n");
      if (empty || !text.trim() || text.includes("\n")) {
        setPos(null);
        return;
      }
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      setPos({
        top: start.top - 44,
        left: (start.left + end.right) / 2,
        annotated: editor.isActive("pinyin"),
      });
    }

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!pos) return null;

  function apply() {
    const current = (editor.getAttributes("pinyin").pinyin as string) ?? "";
    const input = window.prompt("Текст над выделением (пусто — убрать):", current);
    if (input === null) return;
    const pinyin = input.trim();
    if (pinyin) editor.chain().focus().setPinyin(pinyin).run();
    else editor.chain().focus().unsetPinyin().run();
    setPos(null);
  }

  function remove() {
    editor.chain().focus().unsetPinyin().run();
    setPos(null);
  }

  return (
    <div
      className="fixed z-50 flex -translate-x-1/2 gap-1"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Button size="sm" className="shadow-md" onClick={apply}>
        <Languages className="h-4 w-4" />
        {pos.annotated ? "Изменить над" : "Добавить над"}
      </Button>
      {pos.annotated ? (
        <Button size="sm" variant="secondary" className="shadow-md" onClick={remove}>
          <X className="h-4 w-4" />
          Убрать над
        </Button>
      ) : null}
    </div>
  );
}
