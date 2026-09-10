"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { StudentWithAccount } from "@/types";
import { archiveStudentAction } from "./actions";
import { CredentialsDialog } from "./credentials-dialog";
import { StudentDialog } from "./student-dialog";

function StudentRow({ student, canManage }: { student: StudentWithAccount; canManage: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleArchive() {
    startTransition(async () => {
      const result = await archiveStudentAction(student.id, !student.is_archived);
      if (result.success) {
        toast.success(student.is_archived ? "Ученик восстановлен" : "Ученик архивирован");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/students/${student.id}`} className="hover:underline">
          {student.full_name}
        </Link>
      </TableCell>
      <TableCell>
        {student.login ? (
          <Badge variant="secondary">{student.login}</Badge>
        ) : (
          <span className="text-muted-foreground">нет доступа</span>
        )}
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">
        {formatDate(student.created_at)}
      </TableCell>
      <TableCell>
        {student.is_archived ? (
          <Badge variant="outline">В архиве</Badge>
        ) : (
          <Badge variant="success">Активен</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {canManage ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Действия</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}`}>
                <ExternalLink className="h-4 w-4" />
                Открыть
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setCredentialsOpen(true)}>
              <KeyRound className="h-4 w-4" />
              {student.login ? "Обновить доступ" : "Выдать доступ"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                toggleArchive();
              }}
            >
              {student.is_archived ? (
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
          </DropdownMenuContent>
        </DropdownMenu>
        ) : null}

        {canManage ? (
          <>
            <StudentDialog mode="edit" student={student} open={editOpen} onOpenChange={setEditOpen} />
            <CredentialsDialog
              studentId={student.id}
              hasAccount={Boolean(student.login)}
              open={credentialsOpen}
              onOpenChange={setCredentialsOpen}
            />
          </>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

export function StudentsTable({ students, canManage }: { students: StudentWithAccount[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? students.filter((s) => s.full_name.toLowerCase().includes(q) || (s.login ?? "").toLowerCase().includes(q))
    : students;

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по ФИО или логину" className="pl-8" />
      </div>
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
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                Ничего не найдено.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((student) => <StudentRow key={student.id} student={student} canManage={canManage} />)
          )}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}
