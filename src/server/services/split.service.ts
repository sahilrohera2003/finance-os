import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { SplitExpense, ME } from "@/models/SplitExpense";
import { Settlement } from "@/models/Settlement";
import { SplitGroup } from "@/models/SplitGroup";
import { Account } from "@/models/Account";
import type { SplitExpenseInput, SettlementInput, SplitGroupInput } from "@/lib/validations";

const norm = (s: string) => s.trim();
const isMe = (s: string) => norm(s).toLowerCase() === ME.toLowerCase();

export const UNGROUPED = "ungrouped";

export interface ContactBalance {
  name: string;
  /** > 0 → they owe you; < 0 → you owe them. */
  balance: number;
}

export interface SplitSummary {
  contacts: ContactBalance[];
  toCollect: number;
  toPay: number;
  net: number;
}

/** Build the {groupId} filter fragment for a scope. */
function groupFilter(scope?: string): Record<string, unknown> {
  if (scope === undefined) return {}; // all expenses/settlements
  if (scope === UNGROUPED) return { groupId: null };
  return { groupId: new Types.ObjectId(scope) };
}

/* ----------------------------- Groups ----------------------------- */

export async function listGroups(userId: string) {
  await connectDB();
  return SplitGroup.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getGroup(userId: string, id: string) {
  await connectDB();
  const group = await SplitGroup.findOne({ _id: id, userId }).lean();
  if (!group) throw new Error("NOT_FOUND");
  return group;
}

export async function createGroup(userId: string, input: SplitGroupInput) {
  await connectDB();
  const members = Array.from(
    new Set(input.members.map((m) => m.trim()).filter((m) => m && !isMe(m)))
  );
  return SplitGroup.create({ ...input, members, userId });
}

export async function updateGroup(userId: string, id: string, input: SplitGroupInput) {
  await connectDB();
  const members = Array.from(
    new Set(input.members.map((m) => m.trim()).filter((m) => m && !isMe(m)))
  );
  const doc = await SplitGroup.findOneAndUpdate(
    { _id: id, userId },
    { $set: { name: input.name, members, notes: input.notes } },
    { new: true }
  ).lean();
  if (!doc) throw new Error("NOT_FOUND");
  return doc;
}

export async function deleteGroup(userId: string, id: string) {
  await connectDB();
  const group = await SplitGroup.findOne({ _id: id, userId });
  if (!group) throw new Error("NOT_FOUND");
  // Orphan its expenses/settlements to "ungrouped" rather than deleting them.
  await Promise.all([
    SplitExpense.updateMany({ userId, groupId: id }, { $set: { groupId: null } }),
    Settlement.updateMany({ userId, groupId: id }, { $set: { groupId: null } }),
  ]);
  await group.deleteOne();
  return { id };
}

/* ----------------------------- Split expenses ----------------------------- */

export async function listSplitExpenses(userId: string, scope?: string) {
  await connectDB();
  return SplitExpense.find({ userId, ...groupFilter(scope) })
    .sort({ date: -1, createdAt: -1 })
    .lean();
}

export async function createSplitExpense(userId: string, input: SplitExpenseInput) {
  await connectDB();
  return SplitExpense.create({ ...input, groupId: input.groupId ?? null, userId });
}

export async function assignExpenseGroup(userId: string, expenseId: string, groupId: string | null) {
  await connectDB();
  const doc = await SplitExpense.findOneAndUpdate(
    { _id: expenseId, userId },
    { $set: { groupId: groupId ? new Types.ObjectId(groupId) : null } },
    { new: true }
  ).lean();
  if (!doc) throw new Error("NOT_FOUND");
  return doc;
}

export async function deleteSplitExpense(userId: string, id: string) {
  await connectDB();
  const res = await SplitExpense.findOneAndDelete({ _id: id, userId });
  if (!res) throw new Error("NOT_FOUND");
  return { id };
}

/* ----------------------------- Settlements ----------------------------- */

export async function listSettlements(userId: string, scope?: string) {
  await connectDB();
  return Settlement.find({ userId, ...groupFilter(scope) })
    .populate("accountId", "name")
    .sort({ date: -1, createdAt: -1 })
    .lean();
}

export async function createSettlement(userId: string, input: SettlementInput) {
  await connectDB();
  const doc = await Settlement.create({ ...input, groupId: input.groupId ?? null, userId });
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
  if (doc.accountId) {
    const delta = doc.direction === "I_RECEIVED" ? -doc.amount : doc.amount;
    await Account.updateOne({ _id: doc.accountId, userId }, { $inc: { currentBalance: delta } });
  }
  await doc.deleteOne();
  return { id };
}

/* ----------------------------- Balance engine ----------------------------- */

/**
 * Net balance per contact. Pass a `scope` to restrict to one group
 * (a group id) or to ungrouped items (UNGROUPED). Omit for everything.
 */
export async function computeSplitBalances(userId: string, scope?: string): Promise<SplitSummary> {
  await connectDB();
  const base = { userId: new Types.ObjectId(userId), ...groupFilter(scope) };

  const [expenses, settlements] = await Promise.all([
    SplitExpense.find(base).lean(),
    Settlement.find(base).lean(),
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
      for (const p of exp.participants as any[]) {
        if (isMe(p.name)) continue;
        add(p.name, p.amount);
      }
    } else if (myShare > 0) {
      add(payer, -myShare);
    }
  }

  for (const s of settlements as any[]) {
    if (s.direction === "I_RECEIVED") add(s.contactName, -s.amount);
    else add(s.contactName, s.amount);
  }

  const contacts: ContactBalance[] = Array.from(balances.entries())
    .map(([name, balance]) => ({ name, balance: Math.round(balance * 100) / 100 }))
    .filter((c) => Math.abs(c.balance) > 0.009)
    .sort((a, b) => b.balance - a.balance);

  const toCollect = contacts.reduce((s, c) => s + (c.balance > 0 ? c.balance : 0), 0);
  const toPay = contacts.reduce((s, c) => s + (c.balance < 0 ? -c.balance : 0), 0);

  return { contacts, toCollect, toPay, net: toCollect - toPay };
}

export async function computeSplitTotals(userId: string) {
  const { toCollect, toPay } = await computeSplitBalances(userId);
  return { toCollect, toPay };
}

/** Groups (plus a virtual "Ungrouped") with their per-group summary + counts. */
export async function listGroupsWithSummary(userId: string) {
  await connectDB();
  const groups = await listGroups(userId);

  const withSummary = await Promise.all(
    (groups as any[]).map(async (g) => {
      const [summary, count] = await Promise.all([
        computeSplitBalances(userId, g._id.toString()),
        SplitExpense.countDocuments({ userId, groupId: g._id }),
      ]);
      return { ...g, summary, expenseCount: count };
    })
  );

  const ungroupedCount = await SplitExpense.countDocuments({ userId, groupId: null });
  const ungroupedSummary =
    ungroupedCount > 0 ? await computeSplitBalances(userId, UNGROUPED) : null;

  return { groups: withSummary, ungroupedCount, ungroupedSummary };
}

/** Everything needed to render a single group's detail page. */
export async function getGroupDetail(userId: string, scope: string) {
  await connectDB();
  const isUngrouped = scope === UNGROUPED;
  const group = isUngrouped
    ? { _id: UNGROUPED, name: "Ungrouped", members: [] as string[], notes: "" }
    : await getGroup(userId, scope);

  const [expenses, settlements, summary] = await Promise.all([
    listSplitExpenses(userId, scope),
    listSettlements(userId, scope),
    computeSplitBalances(userId, scope),
  ]);

  return { group, expenses, settlements, summary };
}
