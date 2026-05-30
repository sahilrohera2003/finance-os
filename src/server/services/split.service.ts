import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { SplitExpense, ME } from "@/models/SplitExpense";
import { Settlement } from "@/models/Settlement";
import { Account } from "@/models/Account";
import type { SplitExpenseInput, SettlementInput } from "@/lib/validations";

const norm = (s: string) => s.trim();
const isMe = (s: string) => norm(s).toLowerCase() === ME.toLowerCase();

export interface ContactBalance {
  name: string;
  /** > 0 → they owe you; < 0 → you owe them. */
  balance: number;
}

export interface SplitSummary {
  contacts: ContactBalance[];
  toCollect: number; // sum of positive balances (an asset)
  toPay: number; // sum of negative balances, as a positive number (a liability)
  net: number; // toCollect - toPay
}

/* ----------------------------- Split expenses ----------------------------- */

export async function listSplitExpenses(userId: string) {
  await connectDB();
  return SplitExpense.find({ userId }).sort({ date: -1, createdAt: -1 }).lean();
}

export async function createSplitExpense(userId: string, input: SplitExpenseInput) {
  await connectDB();
  return SplitExpense.create({ ...input, userId });
}

export async function deleteSplitExpense(userId: string, id: string) {
  await connectDB();
  const res = await SplitExpense.findOneAndDelete({ _id: id, userId });
  if (!res) throw new Error("NOT_FOUND");
  return { id };
}

/* ----------------------------- Settlements ----------------------------- */

export async function listSettlements(userId: string) {
  await connectDB();
  return Settlement.find({ userId })
    .populate("accountId", "name")
    .sort({ date: -1, createdAt: -1 })
    .lean();
}

export async function createSettlement(userId: string, input: SettlementInput) {
  await connectDB();
  const doc = await Settlement.create({ ...input, userId });
  // Keep the real account balance accurate if one was chosen.
  if (input.accountId) {
    const delta = input.direction === "I_RECEIVED" ? input.amount : -input.amount;
    await Account.updateOne({ _id: input.accountId, userId }, { $inc: { currentBalance: delta } });
  }
  return doc.toObject();
}

export async function deleteSettlement(userId: string, id: string) {
  await connectDB();
  const doc = await Settlement.findOne({ _id: id, userId });
  if (!doc) throw new Error("NOT_FOUND");
  // Reverse the account effect.
  if (doc.accountId) {
    const delta = doc.direction === "I_RECEIVED" ? -doc.amount : doc.amount;
    await Account.updateOne({ _id: doc.accountId, userId }, { $inc: { currentBalance: delta } });
  }
  await doc.deleteOne();
  return { id };
}

/* ----------------------------- Balance engine ----------------------------- */

/**
 * Net balance per contact, considering only debts that involve "Me":
 *  - When I paid: each other participant owes me their share.
 *  - When a contact paid and I'm a participant: I owe them my share.
 *  - Settlements reduce the outstanding balance.
 */
export async function computeSplitBalances(userId: string): Promise<SplitSummary> {
  await connectDB();
  const uid = new Types.ObjectId(userId);

  const [expenses, settlements] = await Promise.all([
    SplitExpense.find({ userId: uid }).lean(),
    Settlement.find({ userId: uid }).lean(),
  ]);

  const balances = new Map<string, number>();
  const add = (name: string, amt: number) => {
    const key = norm(name);
    balances.set(key, (balances.get(key) ?? 0) + amt);
  };

  for (const exp of expenses as any[]) {
    const payer = norm(exp.paidBy);
    const myShare = (exp.participants as any[]).find((p) => isMe(p.name))?.amount ?? 0;

    if (isMe(payer)) {
      // Everyone else owes me their share.
      for (const p of exp.participants as any[]) {
        if (isMe(p.name)) continue;
        add(p.name, p.amount); // they owe me (+)
      }
    } else if (myShare > 0) {
      // The payer covered my share, so I owe the payer.
      add(payer, -myShare);
    }
  }

  for (const s of settlements as any[]) {
    if (s.direction === "I_RECEIVED") add(s.contactName, -s.amount); // reduces what they owe me
    else add(s.contactName, s.amount); // I paid them → reduces what I owe
  }

  const contacts: ContactBalance[] = Array.from(balances.entries())
    .map(([name, balance]) => ({ name, balance: Math.round(balance * 100) / 100 }))
    .filter((c) => Math.abs(c.balance) > 0.009)
    .sort((a, b) => b.balance - a.balance);

  const toCollect = contacts.reduce((s, c) => s + (c.balance > 0 ? c.balance : 0), 0);
  const toPay = contacts.reduce((s, c) => s + (c.balance < 0 ? -c.balance : 0), 0);

  return { contacts, toCollect, toPay, net: toCollect - toPay };
}

/** Lightweight totals for net-worth integration. */
export async function computeSplitTotals(userId: string) {
  const { toCollect, toPay } = await computeSplitBalances(userId);
  return { toCollect, toPay };
}
