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
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function StudentRow({ student }: { student: StudentWithAccount }) {
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

        <StudentDialog mode="edit" student={student} open={editOpen} onOpenChange={setEditOpen} />
        <CredentialsDialog
          studentId={student.id}
          hasAccount={Boolean(student.login)}
          open={credentialsOpen}
          onOpenChange={setCredentialsOpen}
        />
      </TableCell>
    </TableRow>
  );
}

export function StudentsTable({ students }: { students: StudentWithAccount[] }) {
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
          {students.map((student) => (
            <StudentRow key={student.id} student={student} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
