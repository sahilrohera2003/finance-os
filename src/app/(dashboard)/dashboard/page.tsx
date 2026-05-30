import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarClock,
  HandCoins,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import { getUserId } from "@/lib/session";
import { getDashboard } from "@/server/services/analytics.service";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  NetWorthChart,
  ExpensePie,
  IncomeExpenseBar,
} from "@/components/charts/charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = (await getUserId())!;
  const d = await getDashboard(userId);
  const b = d.breakdown;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your financial overview at a glance." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Net Worth" value={formatCurrency(b.netWorth)} icon={Wallet} tone={b.netWorth >= 0 ? "positive" : "negative"} />
        <StatCard label="Total Assets" value={formatCurrency(b.totalAssets)} icon={TrendingUp} tone="positive" />
        <StatCard label="Total Liabilities" value={formatCurrency(b.totalLiabilities)} icon={TrendingDown} tone="negative" />
        <StatCard label="Monthly Obligations" value={formatCurrency(d.monthlyObligationsTotal)} icon={CalendarClock} />
        <StatCard label="Collectables" value={formatCurrency(b.receivablesTotal + b.splitToCollect)} icon={HandCoins} hint={b.splitToCollect ? `incl. ${formatCurrency(b.splitToCollect)} from splits` : undefined} />
        <StatCard label="Payables" value={formatCurrency(b.payablesTotal + b.splitToPay)} icon={ReceiptText} hint={b.splitToPay ? `incl. ${formatCurrency(b.splitToPay)} from splits` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {d.netWorthTrend.length > 1 ? (
              <NetWorthChart data={d.netWorthTrend} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Snapshots build up over time as you add accounts and assets.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Month — Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseBar data={d.incomeVsExpense} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {d.expenseBreakdown.length ? (
              <ExpensePie data={d.expenseBreakdown} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No expenses recorded this month yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {d.recent.length ? (
              <ul className="divide-y">
                {d.recent.map((t: any) => (
                  <ActivityRow key={t._id} tx={t} />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={ArrowLeftRight}
                title="No transactions yet"
                description="Record income, expenses, or transfers to see them here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityRow({ tx }: { tx: any }) {
  const isIncome = tx.type === "INCOME";
  const isExpense = tx.type === "EXPENSE";
  const Icon = isIncome ? ArrowDownLeft : isExpense ? ArrowUpRight : ArrowLeftRight;
  const label =
    tx.type === "TRANSFER"
      ? `${tx.fromAccountId?.name ?? "—"} → ${tx.toAccountId?.name ?? "—"}`
      : tx.accountId?.name ?? "—";

  return (
    <li className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          isIncome && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          isExpense && "bg-destructive/15 text-destructive",
          tx.type === "TRANSFER" && "bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {tx.description || tx.categoryId?.name || tx.type}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {label} · {formatDate(tx.transactionDate)}
        </p>
      </div>
      <span
        className={cn(
          "text-sm font-semibold",
          isIncome && "text-emerald-600 dark:text-emerald-400",
          isExpense && "text-destructive"
        )}
      >
        {isExpense ? "-" : isIncome ? "+" : ""}
        {formatCurrency(tx.amount)}
      </span>
    </li>
  );
}
