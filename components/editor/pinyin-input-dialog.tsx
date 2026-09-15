"use client";

import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PinyinKeys } from "./pinyin-bar";
import { ExtraKeyboardsInline } from "./extra-keyboards";
import { useEnabledKeyboards } from "./keyboards-context";

/**
 * Dialog for entering the "text above" (transcription) annotation, with the ü/
 * tone keys and configurable extra keyboards — a replacement for window.prompt,
 * which can't host those helper buttons. Confirming with an empty value removes
 * the annotation.
 */
export function PinyinInputDialog({
  open,
  defaultValue,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  defaultValue: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: string) => void;
}) {
  const enabled = useEnabledKeyboards();
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  function confirm() {
    onConfirm(value.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}>
        <DialogHeader>
          <DialogTitle>Текст над выделением</DialogTitle>
          <DialogDescription>Транскрипция или подпись, которая появится над выделенным текстом. Пусто — убрать.</DialogDescription>
        </DialogHeader>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Например: nǐ hǎo"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              confirm();
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <PinyinKeys />
          <ExtraKeyboardsInline enabled={enabled} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={confirm}>Применить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
