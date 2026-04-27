"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import type { Route } from "next";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation: {
  href: Route;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports/daily", label: "Daily", icon: CalendarDays },
  { href: "/reports/monthly", label: "Monthly", icon: CalendarRange },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-20 rounded-xl border border-border/70 bg-background/50 p-3">
        <p className="px-2 py-1 text-sm font-semibold">Menu</p>
        <nav className="mt-2 flex flex-col gap-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <Separator className="my-2" />
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </nav>
      </div>
    </aside>
  );
}
