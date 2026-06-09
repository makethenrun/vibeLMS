import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/db/supabase";
import { uploadFile } from "@/services/storage/storage.service";

const ALLOWED_FOLDERS = new Set(["materials", "submissions"]);

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folderValue = formData.get("folder");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Файл пустой" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файл слишком большой (максимум 25 МБ)" }, { status: 413 });
  }

  const folder = typeof folderValue === "string" && ALLOWED_FOLDERS.has(folderValue)
    ? folderValue
    : "materials";

  // Students may only upload homework submissions, not library materials.
  if (user.role === "STUDENT" && folder !== "submissions") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const db = createServerSupabaseClient();
  try {
    const uploaded = await uploadFile(db, { file, folder });
    return NextResponse.json({ url: uploaded.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
