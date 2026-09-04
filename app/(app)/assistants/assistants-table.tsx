"use client";

import { useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { AssistantRow } from "@/services/assistants/assistants.service";
import {
  archiveAssistantAction,
  deleteAssistantAction,
  setAssistantGroupsAction,
  setAssistantMaterialsAction,
} from "./actions";
import { AssistantDialog } from "./assistant-dialog";
import { AssistantCredentialsDialog } from "./assistant-credentials-dialog";

interface Meta {
  groups: { id: string; name: string }[];
  materials: { id: string; title: string }[];
}

function AccessPanel({ assistant, groups, materials }: { assistant: AssistantRow } & Meta) {
  const router = useRouter();
  const matById = new Map(assistant.materials.map((m) => [m.materialId, m.canEdit]));
  const [groupQuery, setGroupQuery] = useState("");
  const [materialQuery, setMaterialQuery] = useState("");
  const gq = groupQuery.trim().toLowerCase();
  const mq = materialQuery.trim().toLowerCase();
  const visibleGroups = gq ? groups.filter((g) => g.name.toLowerCase().includes(gq)) : groups;
  const visibleMaterials = mq ? materials.filter((m) => m.title.toLowerCase().includes(mq)) : materials;

  async function toggleGroup(groupId: string, on: boolean) {
    const next = on ? [...assistant.groupIds, groupId] : assistant.groupIds.filter((g) => g !== groupId);
    const result = await setAssistantGroupsAction(assistant.id, next);
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  async function setMaterial(materialId: string, assigned: boolean, canEdit: boolean) {
    const others = assistant.materials.filter((m) => m.materialId !== materialId);
    const next = assigned ? [...others, { materialId, canEdit }] : others;
    const result = await setAssistantMaterialsAction(assistant.id, next);
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  return (
    <div className="grid gap-6 bg-muted/30 p-4 md:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium">Группы</p>
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">Нет групп.</p>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={groupQuery} onChange={(e) => setGroupQuery(e.target.value)} placeholder="Поиск групп" className="h-8 pl-8" />
            </div>
            <div className="space-y-1">
              {visibleGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground">Ничего не найдено.</p>
              ) : (
                visibleGroups.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={assistant.groupIds.includes(g.id)} onChange={(e) => toggleGroup(g.id, e.target.checked)} />
                    {g.name}
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Материалы (доступ · редактирование)</p>
        {materials.length === 0 ? (
          <p className="text-xs text-muted-foreground">Нет материалов.</p>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={materialQuery} onChange={(e) => setMaterialQuery(e.target.value)} placeholder="Поиск материалов" className="h-8 pl-8" />
            </div>
            <div className="space-y-1">
              {visibleMaterials.length === 0 ? <p className="text-xs text-muted-foreground">Ничего не найдено.</p> : null}
              {visibleMaterials.map((m) => {
              const assigned = matById.has(m.id);
              const canEdit = matById.get(m.id) ?? false;
              return (
                <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <label className="flex flex-1 items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={assigned}
                      onChange={(e) => setMaterial(m.id, e.target.checked, e.target.checked ? canEdit : false)}
                    />
                    <span className="truncate">{m.title}</span>
                  </label>
                  <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <input type="checkbox" checked={canEdit} disabled={!assigned} onChange={(e) => setMaterial(m.id, true, e.target.checked)} />
                    ред.
                  </label>
                </div>
              );
            })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AssistantTableRow({ assistant, groups, materials }: { assistant: AssistantRow } & Meta) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleArchive() {
    startTransition(async () => {
      const result = await archiveAssistantAction(assistant.id, !assistant.isArchived);
      if (result.success) toast.success(assistant.isArchived ? "Ассистент восстановлен" : "Ассистент архивирован");
      else toast.error(result.error);
    });
  }

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 hover:underline">
            {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            {assistant.fullName || <span className="text-muted-foreground">Без имени</span>}
          </button>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{assistant.login}</Badge>
        </TableCell>
        <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(assistant.createdAt)}</TableCell>
        <TableCell>
          {assistant.isArchived ? <Badge variant="outline">В архиве</Badge> : <Badge variant="success">Активен</Badge>}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isPending}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Действия</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCredentialsOpen(true)}>
                <KeyRound className="h-4 w-4" />
                Обновить доступ
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  toggleArchive();
                }}
              >
                {assistant.isArchived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    Восстановить
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Архивировать
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AssistantDialog mode="edit" assistant={assistant} open={editOpen} onOpenChange={setEditOpen} />
          <AssistantCredentialsDialog assistantId={assistant.id} currentLogin={assistant.login} open={credentialsOpen} onOpenChange={setCredentialsOpen} />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Удалить ассистента?"
            description={`Аккаунт «${assistant.login}» и его доступы будут удалены.`}
            confirmLabel="Удалить"
            variant="destructive"
            successMessage="Ассистент удалён"
            action={() => deleteAssistantAction(assistant.id)}
          />
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow>
          <TableCell colSpan={5} className="p-0">
            <AccessPanel assistant={assistant} groups={groups} materials={materials} />
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function AssistantsTable({
  assistants,
  groups,
  materials,
}: {
  assistants: AssistantRow[];
} & Meta) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ФИО</TableHead>
            <TableHead>Логин</TableHead>
            <TableHead className="hidden md:table-cell">Добавлен</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assistants.map((a) => (
            <AssistantTableRow key={a.id} assistant={a} groups={groups} materials={materials} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
