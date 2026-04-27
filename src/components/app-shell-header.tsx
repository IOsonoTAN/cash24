"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionDrawer } from "@/components/transaction/transaction-drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  LogOut,
  Menu,
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

export function AppShellHeader() {
  const pathname = usePathname();

  return (
    <header className="glass sticky top-0 z-30 border-b">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="md:hidden" />
              }
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Cash24 Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-2 p-2">
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
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">Cash24</h1>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <h1 className="text-lg font-semibold">Cash24</h1>
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/20 dark:bg-foreground/35" />
          <nav className="flex items-center gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm transition",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/80 text-secondary-foreground hover:bg-secondary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <TransactionDrawer
            triggerLabel="Add transaction"
            triggerVariant="outline"
            triggerSize="sm"
            triggerClassName="h-9 rounded-xl px-3.5"
          />
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/20 dark:bg-foreground/35" />
          <ThemeToggle className="h-9 w-9 rounded-xl" />
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-3.5"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <TransactionDrawer
            triggerLabel="Add transaction"
            triggerVariant="outline"
            triggerSize="sm"
            triggerClassName="h-8 px-2.5"
          />
          <ThemeToggle className="h-8 w-8" />
        </div>
      </div>
    </header>
  );
}
