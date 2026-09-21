"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Clock, Layers, Lock, Radio, Unlock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LessonAccessMode } from "@/types";
import { setLessonAccessAction } from "../actions";

export interface AccessRule {
  mode: LessonAccessMode;
  availableAt: string | null;
  unlocked: boolean;
}

export interface LessonNode {
  id: string;
  title: string;
  isHomework: boolean;
}
export interface SectionNode {
  id: string;
  title: string;
  isHomework: boolean;
  lessons: LessonNode[];
}
export interface MaterialNode {
  id: string;
  title: string;
  coverUrl: string | null;
  sections: SectionNode[];
}

const MODE_LABEL: Record<LessonAccessMode, string> = {
  OPEN: "Открыт",
  DATE: "По дате",
  PROGRESS: "По прогрессу",
  MANUAL: "Вручную",
};

/** Converts an ISO string to the value a datetime-local input expects. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function LessonAccessControl({
  groupId,
  lessonId,
  rule,
}: {
  groupId: string;
  lessonId: string;
  rule: AccessRule;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<LessonAccessMode>(rule.mode);
  const [unlocked, setUnlocked] = useState(rule.unlocked);
  const [date, setDate] = useState(toLocalInput(rule.availableAt));

  async function save(input: { mode: LessonAccessMode; availableAt?: string | null; unlocked?: boolean }) {
    setBusy(true);
    const result = await setLessonAccessAction(groupId, lessonId, input);
    setBusy(false);
    if (result.success) {
      toast.success("Доступ обновлён");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function onModeChange(next: LessonAccessMode) {
    setMode(next);
    // OPEN/PROGRESS save immediately; DATE waits for the date, MANUAL for a toggle.
    if (next === "OPEN" || next === "PROGRESS") void save({ mode: next });
    if (next === "MANUAL") void save({ mode: next, unlocked });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <select
        value={mode}
        onChange={(e) => onModeChange(e.target.value as LessonAccessMode)}
        disabled={busy}
        className="h-8 rounded-md border bg-background px-2 text-xs"
        aria-label="Режим доступа"
      >
        {(Object.keys(MODE_LABEL) as LessonAccessMode[]).map((m) => (
          <option key={m} value={m}>{MODE_LABEL[m]}</option>
        ))}
      </select>

      {mode === "DATE" ? (
        <>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 w-[13.5rem] pl-7 text-xs"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={busy || !date}
            onClick={() => void save({ mode: "DATE", availableAt: new Date(date).toISOString() })}
          >
            Сохранить
          </Button>
        </>
      ) : null}

      {mode === "MANUAL" ? (
        <Button
          size="sm"
          variant={unlocked ? "default" : "outline"}
          className="h-8"
          disabled={busy}
          onClick={() => {
            const next = !unlocked;
            setUnlocked(next);
            void save({ mode: "MANUAL", unlocked: next });
          }}
        >
          {unlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {unlocked ? "Открыт" : "Закрыт"}
        </Button>
      ) : null}
    </div>
  );
}

function MaterialRow({
  material,
  groupId,
  canManage,
  access,
}: {
  material: MaterialNode;
  groupId: string;
  canManage: boolean;
  access: Record<string, AccessRule>;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const ruleFor = (lessonId: string): AccessRule =>
    access[lessonId] ?? { mode: "OPEN", availableAt: null, unlocked: false };

  return (
    <li className="py-2">
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Свернуть" : "Развернуть"}
          aria-expanded={open}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <Link href={`/materials/${material.id}`} className="flex flex-1 items-center gap-3 hover:text-primary">
          {material.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={material.coverUrl} alt="" className="h-12 w-9 rounded object-cover" />
          ) : (
            <div className="flex h-12 w-9 items-center justify-center rounded bg-muted">
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm font-medium">{material.title}</span>
        </Link>
        <Button asChild size="sm" variant="outline">
          <Link href={`/materials/${material.id}/session/${groupId}`}>
            <Radio className="h-4 w-4" />
            Провести занятие
          </Link>
        </Button>
      </div>

      {open ? (
        <div className="mt-2 space-y-2 pl-9">
          {material.sections.length === 0 ? (
            <p className="text-xs text-muted-foreground">В материале пока нет разделов.</p>
          ) : (
            <ul className="space-y-2">
              {material.sections.map((section) => {
                const secCollapsed = collapsed[section.id] ?? false;
                return (
                  <li key={section.id}>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setCollapsed((p) => ({ ...p, [section.id]: !secCollapsed }))}
                        aria-label={secCollapsed ? "Развернуть" : "Свернуть"}
                        aria-expanded={!secCollapsed}
                      >
                        {secCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <span className="flex-1 truncate text-sm font-medium">{section.title}</span>
                    </div>
                    {secCollapsed ? null : (
                      <ul className="space-y-1 pl-7 pt-1">
                        {section.lessons.length === 0 ? (
                          <li className="px-2 py-1 text-xs text-muted-foreground">Нет уроков</li>
                        ) : (
                          section.lessons.map((lesson) => (
                            <li key={lesson.id} className="flex items-center gap-2">
                              <span className="flex-1 truncate text-sm">{lesson.title}</span>
                              {canManage ? (
                                <LessonAccessControl groupId={groupId} lessonId={lesson.id} rule={ruleFor(lesson.id)} />
                              ) : null}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function GroupMaterialList({
  materials,
  groupId,
  canManage,
  access,
}: {
  materials: MaterialNode[];
  groupId: string;
  canManage: boolean;
  access: Record<string, AccessRule>;
}) {
  if (materials.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Группе пока не открыт доступ ни к одному материалу. Откройте доступ на странице материала.
      </p>
    );
  }
  return (
    <ul className="divide-y">
      {materials.map((m) => (
        <MaterialRow key={m.id} material={m} groupId={groupId} canManage={canManage} access={access} />
      ))}
    </ul>
  );
}
