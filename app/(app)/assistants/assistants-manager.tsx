"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingButton } from "@/components/shared/loading-button";
import type { AssistantRow } from "@/services/assistants/assistants.service";
import {
  createAssistantAction,
  deleteAssistantAction,
  setAssistantGroupsAction,
  setAssistantMaterialsAction,
} from "./actions";

export function AssistantsManager({
  assistants,
  groups,
  materials,
}: {
  assistants: AssistantRow[];
  groups: { id: string; name: string }[];
  materials: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    const result = await createAssistantAction(login, password);
    setCreating(false);
    if (result.success) {
      toast.success("Ассистент создан");
      setLogin("");
      setPassword("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function toggleGroup(a: AssistantRow, groupId: string, on: boolean) {
    const next = on ? [...a.groupIds, groupId] : a.groupIds.filter((g) => g !== groupId);
    const result = await setAssistantGroupsAction(a.id, next);
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  async function setMaterial(a: AssistantRow, materialId: string, assigned: boolean, canEdit: boolean) {
    const others = a.materials.filter((m) => m.materialId !== materialId);
    const next = assigned ? [...others, { materialId, canEdit }] : others;
    const result = await setAssistantMaterialsAction(a.id, next);
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Новый ассистент</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Логин</label>
            <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="assistant1" className="w-48" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Пароль</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="пароль" className="w-48" />
          </div>
          <LoadingButton loading={creating} onClick={create} disabled={!login.trim() || !password}>
            <UserPlus className="h-4 w-4" />
            Создать
          </LoadingButton>
        </CardContent>
      </Card>

      {assistants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока нет ассистентов.</p>
      ) : (
        assistants.map((a) => {
          const matById = new Map(a.materials.map((m) => [m.materialId, m.canEdit]));
          return (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-base">{a.login}</CardTitle>
                <ConfirmDialog
                  trigger={
                    <Button size="icon" variant="ghost" className="text-destructive" aria-label="Удалить">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                  title="Удалить ассистента?"
                  description={`Аккаунт «${a.login}» и его доступы будут удалены.`}
                  confirmLabel="Удалить"
                  variant="destructive"
                  successMessage="Ассистент удалён"
                  action={() => deleteAssistantAction(a.id)}
                />
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Группы</p>
                  {groups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Нет групп.</p>
                  ) : (
                    <div className="space-y-1">
                      {groups.map((g) => (
                        <label key={g.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={a.groupIds.includes(g.id)}
                            onChange={(e) => toggleGroup(a, g.id, e.target.checked)}
                          />
                          {g.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Материалы (доступ · редактирование)</p>
                  {materials.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Нет материалов.</p>
                  ) : (
                    <div className="space-y-1">
                      {materials.map((m) => {
                        const assigned = matById.has(m.id);
                        const canEdit = matById.get(m.id) ?? false;
                        return (
                          <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                            <label className="flex flex-1 items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={assigned}
                                onChange={(e) => setMaterial(a, m.id, e.target.checked, e.target.checked ? canEdit : false)}
                              />
                              <span className="truncate">{m.title}</span>
                            </label>
                            <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={canEdit}
                                disabled={!assigned}
                                onChange={(e) => setMaterial(a, m.id, true, e.target.checked)}
                              />
                              ред.
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
