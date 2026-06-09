import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Library,
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

const BOTH: UserRole[] = ["TUTOR", "STUDENT"];
const TUTOR_ONLY: UserRole[] = ["TUTOR"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard, roles: BOTH },
  { label: "Ученики", href: "/students", icon: Users, roles: TUTOR_ONLY },
  { label: "Группы", href: "/groups", icon: UsersRound, roles: TUTOR_ONLY },
  { label: "Занятия", href: "/lessons", icon: CalendarDays, roles: BOTH },
  { label: "Материалы", href: "/materials", icon: Library, roles: BOTH },
  { label: "Домашние задания", href: "/homework", icon: ClipboardList, roles: BOTH },
  { label: "Оплаты", href: "/payments", icon: Wallet, roles: TUTOR_ONLY },
  { label: "Статистика", href: "/statistics", icon: BarChart3, roles: TUTOR_ONLY },
  { label: "Настройки", href: "/settings", icon: Settings, roles: TUTOR_ONLY },
];
