import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-primary">
        <div className="rounded-lg bg-primary p-2 text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">Finance OS</span>
      </div>
      {children}
      <p className="mt-6 max-w-sm text-center text-xs text-muted-foreground">
        Your personal financial operating system — assets, liabilities, cash flow, and net worth in one place.
      </p>
    </div>
  );
}
