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
    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
      {logoUrl ? (
        <img src={logoUrl} alt={orgName} className="h-7 w-7 rounded object-cover" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="h-4 w-4" />
        </span>
      )}
      <span className="truncate">{orgName}</span>
    </Link>
  );
}

export function AppShell({ role, login, orgName, logoUrl, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Brand orgName={orgName} logoUrl={logoUrl} />
        </div>
        <SidebarNav role={role} className="flex-1 overflow-y-auto px-3 py-4" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                className="px-3 py-4"
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
