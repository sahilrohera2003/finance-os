import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Asset } from "@/models/Asset";
import { Receivable } from "@/models/Receivable";
import { Payable } from "@/models/Payable";
import { Loan } from "@/models/Loan";
import { NetWorthSnapshot } from "@/models/NetWorthSnapshot";
import { computeSplitTotals } from "./split.service";

export interface NetWorthBreakdown {
  accountsTotal: number;
  assetsTotal: number;
  receivablesTotal: number;
  splitToCollect: number;
  totalAssets: number;
  loansTotal: number;
  payablesTotal: number;
  splitToPay: number;
  totalLiabilities: number;
  netWorth: number;
}

async function sum(model: any, match: Record<string, unknown>, field: string) {
  const res = await model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return res[0]?.total ?? 0;
}

/** Compute the full net-worth breakdown for a user from live data. */
export async function computeNetWorth(userId: string): Promise<NetWorthBreakdown> {
  await connectDB();
  const uid = new Types.ObjectId(userId);

  const [accountsTotal, assetsTotal, receivablesTotal, loansTotal, payablesTotal, splits] =
    await Promise.all([
      sum(Account, { userId: uid }, "currentBalance"),
      sum(Asset, { userId: uid }, "currentValue"),
      sum(Receivable, { userId: uid, status: "PENDING" }, "amount"),
      sum(Loan, { userId: uid, status: "ACTIVE" }, "outstandingAmount"),
      sum(Payable, { userId: uid, status: "PENDING" }, "amount"),
      computeSplitTotals(userId),
    ]);

  const totalAssets = accountsTotal + assetsTotal + receivablesTotal + splits.toCollect;
  const totalLiabilities = loansTotal + payablesTotal + splits.toPay;

  return {
    accountsTotal,
    assetsTotal,
    receivablesTotal,
    splitToCollect: splits.toCollect,
    totalAssets,
    loansTotal,
    payablesTotal,
    splitToPay: splits.toPay,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

/** Persist a snapshot of net worth — at most one per calendar day (upsert). */
export async function createSnapshot(userId: string) {
  const b = await computeNetWorth(userId);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const fields = {
    assetValue: b.totalAssets,
    liabilityValue: b.totalLiabilities,
    netWorth: b.netWorth,
    snapshotDate: now,
  };

  // Replace today's snapshot if one already exists, otherwise insert.
  const existing = await NetWorthSnapshot.findOne({
    userId,
    snapshotDate: { $gte: start, $lte: end },
  });
  if (existing) {
    Object.assign(existing, fields);
    await existing.save();
    return existing;
  }
  return NetWorthSnapshot.create({ userId, ...fields });
}

export async function listSnapshots(userId: string, limit = 365) {
  await connectDB();
  return NetWorthSnapshot.find({ userId })
    .sort({ snapshotDate: 1 })
    .limit(limit)
    .lean();
}
