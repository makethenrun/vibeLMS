import {
  BarChart3,
  Bot,
  BookA,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Keyboard,
  LayoutDashboard,
  Library,
  Search,
  Settings,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/lib/db/database.types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export interface ExternalLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** External tool links shown at the bottom of the sidebar (open in a new tab). */
export const EXTERNAL_LINKS: ExternalLink[] = [
  { label: "DeepSeek", href: "https://chat.deepseek.com", icon: Bot },
  { label: "Baidu", href: "https://www.baidu.com", icon: Search },
  { label: "БКРС", href: "https://bkrs.info", icon: BookA },
  { label: "Pinyin TypeIt", href: "https://pinyin.typeit.org", icon: Keyboard },
];

const ALL: UserRole[] = ["TUTOR", "STUDENT", "ASSISTANT", "ADMINISTRATOR"];
const BOTH: UserRole[] = ["TUTOR", "STUDENT"];
const STAFF: UserRole[] = ["TUTOR", "ASSISTANT", "ADMINISTRATOR"];
const MANAGER: UserRole[] = ["TUTOR", "ADMINISTRATOR"];
const TUTOR_ONLY: UserRole[] = ["TUTOR"];
const STUDENT_ONLY: UserRole[] = ["STUDENT"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard, roles: ["TUTOR", "STUDENT", "ASSISTANT"] },
  { label: "Ученики", href: "/students", icon: Users, roles: MANAGER },
  { label: "Ассистенты", href: "/assistants", icon: UsersRound, roles: MANAGER },
  { label: "Группы", href: "/groups", icon: UsersRound, roles: STAFF },
  { label: "Занятия", href: "/lessons", icon: CalendarDays, roles: ALL },
  { label: "Материалы", href: "/materials", icon: Library, roles: STAFF },
  { label: "Обучение", href: "/learn", icon: GraduationCap, roles: STUDENT_ONLY },
  { label: "Файлы", href: "/files", icon: FileText, roles: ALL },
  { label: "Словарь", href: "/dictionary", icon: BookA, roles: ALL },
  { label: "Дополнительные задания", href: "/homework", icon: ClipboardList, roles: BOTH },
  { label: "Оплаты", href: "/payments", icon: Wallet, roles: MANAGER },
  { label: "Статистика", href: "/statistics", icon: BarChart3, roles: TUTOR_ONLY },
  { label: "Настройки", href: "/settings", icon: Settings, roles: MANAGER },
];
