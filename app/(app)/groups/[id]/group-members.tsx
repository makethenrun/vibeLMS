"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [addQuery, setAddQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const aq = addQuery.trim().toLowerCase();
  const filteredAddable = aq ? addable.filter((s) => s.full_name.toLowerCase().includes(aq)) : addable;
  const mq = memberQuery.trim().toLowerCase();
  const filteredMembers = mq ? members.filter((s) => s.full_name.toLowerCase().includes(mq)) : members;

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
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={addQuery} onChange={(e) => setAddQuery(e.target.value)} placeholder="Поиск ученика" className="pl-8" />
              </div>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ученика" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAddable.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Ничего не найдено</div>
                  ) : (
                    filteredAddable.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name}
                      </SelectItem>
                    ))
                  )}
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
        <CardContent className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">В группе пока нет учеников.</p>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="Поиск в группе" className="pl-8" />
              </div>
              <ul className="divide-y">
              {filteredMembers.length === 0 ? (
                <li className="py-2 text-sm text-muted-foreground">Ничего не найдено.</li>
              ) : filteredMembers.map((member) => (
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
