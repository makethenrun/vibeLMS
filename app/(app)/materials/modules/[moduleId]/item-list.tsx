"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type {
  ChoiceContent,
  FreeContent,
  GapsContent,
  InfoContent,
  ItemContent,
  MatchContent,
} from "@/lib/validators";
import type { ItemRow, MaterialItemType } from "@/types";
import { deleteItemAction, moveItemAction, updateItemAction } from "../../actions";
import { AddItemMenu } from "./add-item-menu";
import { ChoiceEditor } from "./item-editors/choice-editor";
import { FreeEditor } from "./item-editors/free-editor";
import { GapsEditor } from "./item-editors/gaps-editor";
import { InfoEditor } from "./item-editors/info-editor";
import { MatchEditor } from "./item-editors/match-editor";

const TYPE_LABELS: Record<MaterialItemType, string> = {
  INFO: "Обучающая информация",
  CHOICE: "Выбор ответа",
  GAPS: "Заполнить пропуски",
  FREE: "Свободный ответ",
  MATCH: "Сопоставление пар",
};

export function ItemList({ moduleId, items }: { moduleId: string; items: ItemRow[] }) {
  const router = useRouter();

  function makeOnSave(itemId: string) {
    return async (content: ItemContent) => {
      const result = await updateItemAction(itemId, moduleId, content);
      if (result.success) {
        toast.success("Сохранено");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    };
  }

  async function move(itemId: string, direction: "up" | "down") {
    const result = await moveItemAction(itemId, moduleId, direction);
    if (result.success) router.refresh();
    else toast.error(result.error);
  }

  function renderEditor(item: ItemRow) {
    const onSave = makeOnSave(item.id);
    switch (item.type) {
      case "INFO":
        return <InfoEditor content={item.content as unknown as InfoContent} onSave={onSave} />;
      case "CHOICE":
        return <ChoiceEditor content={item.content as unknown as ChoiceContent} onSave={onSave} />;
      case "GAPS":
        return <GapsEditor content={item.content as unknown as GapsContent} onSave={onSave} />;
      case "FREE":
        return <FreeEditor content={item.content as unknown as FreeContent} onSave={onSave} />;
      case "MATCH":
        return <MatchEditor content={item.content as unknown as MatchContent} onSave={onSave} />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока нет элементов. Добавьте первый.</p>
      ) : (
        items.map((item, index) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b py-3">
              <span className="text-sm font-medium">{TYPE_LABELS[item.type]}</span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => move(item.id, "up")}
                  aria-label="Вверх"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={index === items.length - 1}
                  onClick={() => move(item.id, "down")}
                  aria-label="Вниз"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Удалить">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                  title="Удалить элемент?"
                  description="Элемент будет удалён без возможности восстановления."
                  confirmLabel="Удалить"
                  variant="destructive"
                  successMessage="Элемент удалён"
                  action={() => deleteItemAction(item.id, moduleId)}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-4">{renderEditor(item)}</CardContent>
          </Card>
        ))
      )}

      <AddItemMenu moduleId={moduleId} />
    </div>
  );
}
