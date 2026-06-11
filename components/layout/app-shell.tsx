"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { UserRole } from "@/lib/db/database.types";
import { Breadcrumbs } from "./breadcrumbs";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

interface AppShellProps {
  role: UserRole;
  login: string;
  orgName: string;
  logoUrl: string | null;
  children: React.ReactNode;
}

function Brand({ orgName, logoUrl }: { orgName: string; logoUrl: string | null }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden font-semibold">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center">
        {logoUrl ? (
          <img src={logoUrl} alt={orgName} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </span>
        )}
      </span>
      <span className="whitespace-nowrap text-base tracking-tight">{orgName}</span>
    </Link>
  );
}

export function AppShell({ role, login, orgName, logoUrl, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Spacer reserving the collapsed rail width so content never reflows */}
      <div className="hidden w-16 shrink-0 md:block" aria-hidden="true" />

      {/* Desktop hover-expand rail: 64px collapsed, 256px on hover/focus */}
      <aside
        className="group fixed inset-y-0 left-0 z-40 hidden w-16 flex-col overflow-hidden border-r bg-sidebar transition-[width] duration-300 ease-in-out hover:w-64 hover:shadow-2xl focus-within:w-64 md:flex"
      >
        <div className="flex h-14 shrink-0 items-center border-b px-3">
          <Brand orgName={orgName} logoUrl={logoUrl} />
        </div>
        <SidebarNav
          role={role}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3"
        />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Меню">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle>
                  <Brand orgName={orgName} logoUrl={logoUrl} />
                </SheetTitle>
              </SheetHeader>
              <SidebarNav
                role={role}
                className="px-3 py-3"
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Breadcrumbs className="min-w-0 flex-1" />
          <UserMenu login={login} role={role} />
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
