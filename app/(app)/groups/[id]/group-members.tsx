"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Student } from "@/types";
import { addMemberAction, removeMemberAction } from "../actions";

interface GroupMembersProps {
  groupId: string;
  members: Student[];
  addable: Student[];
}

export function GroupMembers({ groupId, members, addable }: GroupMembersProps) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!selected) return;
    startTransition(async () => {
      const result = await addMemberAction(groupId, selected);
      if (result.success) {
        toast.success("Ученик добавлен в группу");
        setSelected("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(studentId: string) {
    startTransition(async () => {
      const result = await removeMemberAction(groupId, studentId);
      if (result.success) {
        toast.success("Ученик удалён из группы");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Добавить ученика</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {addable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Все активные ученики уже состоят в этой группе.
            </p>
          ) : (
            <>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ученика" />
                </SelectTrigger>
                <SelectContent>
                  {addable.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={add} disabled={!selected || isPending} className="w-full">
                <UserPlus className="h-4 w-4" />
                Добавить
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Участники ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">В группе пока нет учеников.</p>
          ) : (
            <ul className="divide-y">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">{member.full_name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(member.id)}
                    disabled={isPending}
                    aria-label={`Удалить ${member.full_name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
