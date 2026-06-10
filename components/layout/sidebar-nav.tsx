"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/db/database.types";
import { NAV_ITEMS } from "./nav-config";

interface SidebarNavProps {
  role: UserRole;
  className?: string;
  onNavigate?: () => void;
}

export function SidebarNav({ role, className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group/nav relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200",
                !isActive && "group-hover/nav:scale-110",
              )}
            />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
