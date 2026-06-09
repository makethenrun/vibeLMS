import type {
  HomeworkType,
  LessonStatus,
  MaterialType,
  UserRole,
} from "@/lib/db/database.types";

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  SCHEDULED: "Запланировано",
  COMPLETED: "Проведено",
  CANCELLED: "Отменено",
};

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  PDF: "PDF",
  DOCX: "DOCX",
  JPG: "JPG",
  PNG: "PNG",
  WEBP: "WEBP",
  VIDEO_LINK: "Видео-ссылка",
};

export const HOMEWORK_TYPE_LABELS: Record<HomeworkType, string> = {
  FILE: "Файл",
  QUIZ: "Тест",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  TUTOR: "Преподаватель",
  STUDENT: "Ученик",
};

/** Material types that are backed by an uploaded file (everything but links). */
export const FILE_MATERIAL_TYPES = ["PDF", "DOCX", "JPG", "PNG", "WEBP"] as const;

export const ACCEPTED_FILE_EXTENSIONS: Record<(typeof FILE_MATERIAL_TYPES)[number], string> = {
  PDF: ".pdf",
  DOCX: ".doc,.docx",
  JPG: ".jpg,.jpeg",
  PNG: ".png",
  WEBP: ".webp",
};

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export const LESSON_STATUS_OPTIONS: { value: LessonStatus; label: string }[] = (
  Object.keys(LESSON_STATUS_LABELS) as LessonStatus[]
).map((value) => ({ value, label: LESSON_STATUS_LABELS[value] }));

export const MATERIAL_TYPE_OPTIONS: { value: MaterialType; label: string }[] = (
  Object.keys(MATERIAL_TYPE_LABELS) as MaterialType[]
).map((value) => ({ value, label: MATERIAL_TYPE_LABELS[value] }));
