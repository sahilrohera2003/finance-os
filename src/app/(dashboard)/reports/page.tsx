import { BarChart3 } from "lucide-react";
import { getUserId } from "@/lib/session";
import {
  incomeVsExpenseByMonth,
  categorySpending,
  netWorthTrend,
} from "@/server/services/analytics.service";
import { computeNetWorth } from "@/server/services/networth.service";
import { startOfMonth } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ResetHistoryButton } from "@/components/shared/reset-history-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IncomeExpenseBar,
  ExpensePie,
  NetWorthHistoryChart,
} from "@/components/charts/charts";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const userId = (await getUserId())!;

  // Year-to-date range for category spending.
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [ivse, categories, trend, breakdown] = await Promise.all([
    incomeVsExpenseByMonth(userId, 12),
    categorySpending(userId, startOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1)), now),
    netWorthTrend(userId),
    computeNetWorth(userId),
  ]);

  const totalIncome = ivse.reduce((s, m) => s + m.income, 0);
  const totalExpense = ivse.reduce((s, m) => s + m.expense, 0);
  const net = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Insights into your cash flow and net worth." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Income (12 mo)</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Expense (12 mo)</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Net Cash Flow</p>
          <p className="text-xl font-bold">{formatCurrency(net)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Income vs Expense — Monthly Cash Flow</CardTitle></CardHeader>
        <CardContent><IncomeExpenseBar data={ivse} /></CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Category Spending (last 6 months)</CardTitle></CardHeader>
          <CardContent>
            {categories.length ? (
              <ExpensePie data={categories} />
            ) : (
              <EmptyState icon={BarChart3} title="No spending data" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Net Worth History</CardTitle>
            <ResetHistoryButton />
          </CardHeader>
          <CardContent>
            {trend.length > 1 ? (
              <NetWorthHistoryChart data={trend} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current net worth</p>
                <p className={`mt-1 text-2xl font-bold ${breakdown.netWorth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {formatCurrency(breakdown.netWorth)}
                </p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  History starts from today and fills in as days pass.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
