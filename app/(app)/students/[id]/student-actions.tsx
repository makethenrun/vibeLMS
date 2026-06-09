"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, KeyRound, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { StudentWithAccount } from "@/types";
import { archiveStudentAction } from "../actions";
import { CredentialsDialog } from "../credentials-dialog";
import { StudentDialog } from "../student-dialog";

export function StudentActions({ student }: { student: StudentWithAccount }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleArchive() {
    startTransition(async () => {
      const result = await archiveStudentAction(student.id, !student.is_archived);
      if (result.success) {
        toast.success(student.is_archived ? "Ученик восстановлен" : "Ученик архивирован");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4" />
        Редактировать
      </Button>
      <Button variant="outline" onClick={() => setCredentialsOpen(true)}>
        <KeyRound className="h-4 w-4" />
        {student.login ? "Обновить доступ" : "Выдать доступ"}
      </Button>
      <Button variant="outline" onClick={toggleArchive} disabled={isPending}>
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
      </Button>

      <StudentDialog mode="edit" student={student} open={editOpen} onOpenChange={setEditOpen} />
      <CredentialsDialog
        studentId={student.id}
        hasAccount={Boolean(student.login)}
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
      />
    </div>
  );
}
