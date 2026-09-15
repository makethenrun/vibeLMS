"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Languages, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PinyinInputDialog } from "./pinyin-input-dialog";

interface Pos {
  top: number;
  left: number;
  annotated: boolean;
}

/**
 * Floating "Добавить над" button that appears above a non-empty text selection
 * inside the rich-text editor. Opens a dialog to enter the annotation (with the
 * transcription keyboards) and applies it as a ruby-style mark over the selection.
 */
export function PinyinSelection({ editor }: { editor: Editor }) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [range, setRange] = useState<{ from: number; to: number }>({ from: 0, to: 0 });
  const [current, setCurrent] = useState("");

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

  function openDialog() {
    const { from, to } = editor.state.selection;
    setRange({ from, to });
    setCurrent((editor.getAttributes("pinyin").pinyin as string) ?? "");
    setDlgOpen(true);
    setPos(null);
  }

  function remove() {
    const { from, to } = editor.state.selection;
    editor.chain().focus().setTextSelection({ from, to }).unsetMark("pinyin").run();
    setPos(null);
  }

  function applyValue(value: string) {
    const chain = editor.chain().focus().setTextSelection(range);
    if (value) chain.setMark("pinyin", { pinyin: value }).run();
    else chain.unsetMark("pinyin").run();
  }

  return (
    <>
      {pos ? (
        <div
          className="fixed z-50 flex -translate-x-1/2 gap-1"
          style={{ top: pos.top, left: pos.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button size="sm" className="shadow-md" onClick={openDialog}>
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
      ) : null}

      <PinyinInputDialog open={dlgOpen} defaultValue={current} onOpenChange={setDlgOpen} onConfirm={applyValue} />
    </>
  );
}
