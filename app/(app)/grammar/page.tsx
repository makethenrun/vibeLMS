import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { listGrammar } from "@/services/grammar/grammar.service";
import { GrammarBrowser } from "./grammar-browser";

export const metadata: Metadata = { title: "Грамматический справочник" };

export default async function GrammarPage() {
  const user = await requireUser();
  const canManage = user.role === "TUTOR" || user.role === "ADMINISTRATOR";

  const db = createServerSupabaseClient();
  const entries = await listGrammar(db);

  return (
    <div className="space-y-6">
      <PageHeader title="Грамматический справочник" description="Правила грамматики — листайте карточки и ищите." />
      <GrammarBrowser entries={entries} canManage={canManage} />
    </div>
  );
}
