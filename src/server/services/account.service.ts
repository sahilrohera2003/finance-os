import { connectDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Transaction } from "@/models/Transaction";
import type { AccountInput } from "@/lib/validations";

export async function listAccounts(userId: string) {
  await connectDB();
  return Account.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getAccount(userId: string, id: string) {
  await connectDB();
  const account = await Account.findOne({ _id: id, userId }).lean();
  if (!account) throw new Error("NOT_FOUND");
  return account;
}

export async function createAccount(userId: string, input: AccountInput) {
  await connectDB();
  return Account.create({ ...input, userId });
}

export async function updateAccount(userId: string, id: string, input: AccountInput) {
  await connectDB();
  const account = await Account.findOneAndUpdate(
    { _id: id, userId },
    { $set: input },
    { new: true }
  ).lean();
  if (!account) throw new Error("NOT_FOUND");
  return account;
}

export async function deleteAccount(userId: string, id: string) {
  await connectDB();
  // Guard: do not delete accounts that still have linked transactions.
  const linked = await Transaction.countDocuments({
    userId,
    $or: [{ accountId: id }, { fromAccountId: id }, { toAccountId: id }],
  });
  if (linked > 0) {
    throw new Error(
      "Cannot delete an account with existing transactions. Reassign or remove them first."
    );
  }
  const res = await Account.findOneAndDelete({ _id: id, userId });
  if (!res) throw new Error("NOT_FOUND");
  return { id };
}
