import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { getUserId } from "@/lib/session";
import { SidebarNav, BottomNav } from "@/components/shared/nav";
import { UserMenu } from "@/components/shared/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Finance OS</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav />
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="font-bold">Finance OS</span>
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-6 p-4 pb-24 sm:p-6 lg:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
