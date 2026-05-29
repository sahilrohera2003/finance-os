import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Asset } from "@/models/Asset";
import { Receivable } from "@/models/Receivable";
import { Payable } from "@/models/Payable";
import { Loan } from "@/models/Loan";
import { NetWorthSnapshot } from "@/models/NetWorthSnapshot";

export interface NetWorthBreakdown {
  accountsTotal: number;
  assetsTotal: number;
  receivablesTotal: number;
  totalAssets: number;
  loansTotal: number;
  payablesTotal: number;
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

  const [accountsTotal, assetsTotal, receivablesTotal, loansTotal, payablesTotal] =
    await Promise.all([
      sum(Account, { userId: uid }, "currentBalance"),
      sum(Asset, { userId: uid }, "currentValue"),
      sum(Receivable, { userId: uid, status: "PENDING" }, "amount"),
      sum(Loan, { userId: uid, status: "ACTIVE" }, "outstandingAmount"),
      sum(Payable, { userId: uid, status: "PENDING" }, "amount"),
    ]);

  const totalAssets = accountsTotal + assetsTotal + receivablesTotal;
  const totalLiabilities = loansTotal + payablesTotal;

  return {
    accountsTotal,
    assetsTotal,
    receivablesTotal,
    totalAssets,
    loansTotal,
    payablesTotal,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

/** Persist a point-in-time snapshot of net worth. */
export async function createSnapshot(userId: string) {
  const b = await computeNetWorth(userId);
  return NetWorthSnapshot.create({
    userId,
    assetValue: b.totalAssets,
    liabilityValue: b.totalLiabilities,
    netWorth: b.netWorth,
    snapshotDate: new Date(),
  });
}

export async function listSnapshots(userId: string, limit = 24) {
  await connectDB();
  return NetWorthSnapshot.find({ userId })
    .sort({ snapshotDate: 1 })
    .limit(limit)
    .lean();
}
