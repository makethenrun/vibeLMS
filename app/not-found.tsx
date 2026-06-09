import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 p-6 text-center">
      <p className="text-5xl font-bold">404</p>
      <h1 className="text-lg font-semibold">Страница не найдена</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Возможно, страница была удалена или адрес введён неверно.
      </p>
      <Button asChild>
        <Link href="/dashboard">На главную</Link>
      </Button>
    </div>
  );
}
