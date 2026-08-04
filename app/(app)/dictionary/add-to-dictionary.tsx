"use client";

import { useEffect, useRef, useState } from "react";
import { BookPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntryDialog } from "./entry-dialog";

interface Pos {
  text: string;
  top: number;
  left: number;
}

/**
 * Shows a floating "Добавить в словарь" button when the tutor selects a short
 * piece of text anywhere in the app. Mounted app-wide for tutors.
 */
export function AddToDictionary() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [term, setTerm] = useState("");
  const dialogRef = useRef(false);
  dialogRef.current = dialogOpen;

  useEffect(() => {
    function onUp() {
      window.setTimeout(() => {
        if (dialogRef.current) return;
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? "";
        if (!sel || sel.rangeCount === 0 || text.length < 1 || text.length > 60 || text.includes("\n")) {
          setPos(null);
          return;
        }
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        if (!rect.width && !rect.height) {
          setPos(null);
          return;
        }
        setPos({ text, top: rect.bottom + 6, left: rect.left });
      }, 0);
    }
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []);

  return (
    <>
      {pos ? (
        <div
          className="fixed z-50"
          style={{ top: pos.top, left: pos.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button
            size="sm"
            className="shadow-md"
            onClick={() => {
              setTerm(pos.text);
              setPos(null);
              setDialogOpen(true);
            }}
          >
            <BookPlus className="h-4 w-4" />
            Добавить в словарь
          </Button>
        </div>
      ) : null}

      <EntryDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultTerm={term} />
    </>
  );
}
