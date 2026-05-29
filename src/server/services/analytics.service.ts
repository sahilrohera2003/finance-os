import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { MonthlyObligation } from "@/models/MonthlyObligation";
import { computeNetWorth, listSnapshots } from "./networth.service";
import { recentTransactions } from "./transaction.service";
import { startOfMonth, endOfMonth } from "@/lib/utils";

function oid(id: string) {
  return new Types.ObjectId(id);
}

/** Income vs Expense totals grouped by YYYY-MM for the last N months. */
export async function incomeVsExpenseByMonth(userId: string, months = 6) {
  await connectDB();
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: oid(userId),
        type: { $in: ["INCOME", "EXPENSE"] },
        transactionDate: { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const map = new Map<string, { month: string; income: number; expense: number }>();
  // Pre-seed all months so the chart has no gaps.
  for (let i = 0; i < months; i++) {
    const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    map.set(key, { month: label, income: 0, expense: 0 });
  }
  for (const r of rows) {
    const key = `${r._id.year}-${String(r._id.month).padStart(2, "0")}`;
    const entry = map.get(key);
    if (!entry) continue;
    if (r._id.type === "INCOME") entry.income = r.total;
    else entry.expense = r.total;
  }
  return Array.from(map.values());
}

/** Expense totals grouped by category for a given month (default current). */
export async function expenseBreakdown(userId: string, date = new Date()) {
  await connectDB();
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: oid(userId),
        type: "EXPENSE",
        transactionDate: { $gte: startOfMonth(date), $lte: endOfMonth(date) },
      },
    },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $sort: { total: -1 } },
  ]);

  return rows.map((r) => ({
    name: r.category?.[0]?.name ?? "Uncategorized",
    value: r.total,
  }));
}

/** Category spending over an arbitrary range (for the reports page). */
export async function categorySpending(userId: string, from: Date, to: Date) {
  await connectDB();
  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: oid(userId),
        type: "EXPENSE",
        transactionDate: { $gte: from, $lte: to },
      },
    },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
    {
      $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" },
    },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ name: r.category?.[0]?.name ?? "Uncategorized", value: r.total }));
}

export async function netWorthTrend(userId: string) {
  const snapshots = await listSnapshots(userId);
  return snapshots.map((s: any) => ({
    date: new Date(s.snapshotDate).toLocaleString("en-IN", { month: "short", year: "2-digit" }),
    netWorth: s.netWorth,
    assets: s.assetValue,
    liabilities: s.liabilityValue,
  }));
}

/** Aggregated dashboard payload. */
export async function getDashboard(userId: string) {
  await connectDB();
  const [breakdown, obligations, ivse, breakdownChart, trend, recent] = await Promise.all([
    computeNetWorth(userId),
    MonthlyObligation.aggregate([
      { $match: { userId: oid(userId), active: true } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    incomeVsExpenseByMonth(userId, 6),
    expenseBreakdown(userId),
    netWorthTrend(userId),
    recentTransactions(userId, 8),
  ]);

  const current = ivse[ivse.length - 1] ?? { income: 0, expense: 0 };

  return {
    breakdown,
    monthlyObligationsTotal: obligations[0]?.total ?? 0,
    currentMonth: { income: current.income, expense: current.expense },
    incomeVsExpense: ivse,
    expenseBreakdown: breakdownChart,
    netWorthTrend: trend,
    recent: JSON.parse(JSON.stringify(recent)),
  };
}
