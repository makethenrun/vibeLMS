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
              // px-3 (nav) + w-10 (icon zone) + gap-3 == 64px, so the label
              // starts exactly at the collapsed rail edge and is fully hidden.
              "group/nav flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center">
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  !isActive && "group-hover/nav:scale-110",
                )}
              />
            </span>
            <span className="whitespace-nowrap pr-3">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
