import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Transaction } from "@/models/Transaction";
// Importing these registers their schemas so `.populate()` can resolve the refs.
import "@/models/Category";
import "@/models/Tag";
import type { TransactionInput } from "@/lib/validations";

export interface TransactionFilters {
  type?: string;
  accountId?: string;
  categoryId?: string;
  tagId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

async function adjustBalance(accountId: string | Types.ObjectId, userId: string, delta: number) {
  const res = await Account.updateOne(
    { _id: accountId, userId },
    { $inc: { currentBalance: delta } }
  );
  if (res.matchedCount === 0) throw new Error("NOT_FOUND");
}

/** Apply (sign = +1) or reverse (sign = -1) a transaction's balance effects. */
async function applyEffects(
  tx: { type: string; amount: number; accountId?: any; fromAccountId?: any; toAccountId?: any },
  userId: string,
  sign: 1 | -1
) {
  const amt = tx.amount * sign;
  if (tx.type === "INCOME") {
    await adjustBalance(tx.accountId, userId, amt);
  } else if (tx.type === "EXPENSE") {
    await adjustBalance(tx.accountId, userId, -amt);
  } else if (tx.type === "TRANSFER") {
    await adjustBalance(tx.fromAccountId, userId, -amt);
    await adjustBalance(tx.toAccountId, userId, amt);
  }
}

export async function listTransactions(userId: string, filters: TransactionFilters = {}) {
  await connectDB();
  const q: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

  if (filters.type) q.type = filters.type;
  if (filters.categoryId) q.categoryId = filters.categoryId;
  if (filters.tagId) q.tagIds = filters.tagId;
  if (filters.accountId) {
    q.$or = [
      { accountId: filters.accountId },
      { fromAccountId: filters.accountId },
      { toAccountId: filters.accountId },
    ];
  }
  if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.$gte = new Date(filters.from);
    if (filters.to) range.$lte = new Date(filters.to);
    q.transactionDate = range;
  }

  return Transaction.find(q)
    .populate("accountId", "name type")
    .populate("fromAccountId", "name type")
    .populate("toAccountId", "name type")
    .populate("categoryId", "name type")
    .populate("tagIds", "name")
    .sort({ transactionDate: -1, createdAt: -1 })
    .limit(filters.limit ?? 200)
    .lean();
}

export async function createTransaction(userId: string, input: TransactionInput) {
  await connectDB();
  const doc = await Transaction.create({ ...input, userId });
  await applyEffects(doc, userId, 1);
  return doc.toObject();
}

export async function deleteTransaction(userId: string, id: string) {
  await connectDB();
  const tx = await Transaction.findOne({ _id: id, userId });
  if (!tx) throw new Error("NOT_FOUND");
  // Reverse the balance effect before removing.
  await applyEffects(tx, userId, -1);
  await tx.deleteOne();
  return { id };
}

/** Recent activity feed for the dashboard. */
export async function recentTransactions(userId: string, limit = 8) {
  return listTransactions(userId, { limit });
}
