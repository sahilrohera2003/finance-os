"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  HandCoins,
  ReceiptText,
  Landmark,
  CalendarClock,
  Gem,
  BarChart3,
  Settings,
  Users,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  HandCoins,
  ReceiptText,
  Landmark,
  CalendarClock,
  Gem,
  BarChart3,
  Settings,
  Users,
};

/** Desktop sidebar links. */
export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

const PRIMARY = ["/dashboard", "/accounts", "/transactions", "/splits"];

/** Mobile bottom navigation: 4 primary items + a "More" sheet for the rest. */
export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const primary = NAV_ITEMS.filter((i) => PRIMARY.includes(i.href));
  const rest = NAV_ITEMS.filter((i) => !PRIMARY.includes(i.href));
  const onMorePage = rest.some((i) => i.href === pathname);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 backdrop-blur lg:hidden">
        {primary.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
            onMorePage ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="bottom-0 top-auto translate-y-0 rounded-b-none sm:rounded-lg">
          <DialogHeader>
            <DialogTitle>All sections</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 pb-2">
            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.icon];
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors",
                    active ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
