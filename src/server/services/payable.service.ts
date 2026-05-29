import { connectDB } from "@/lib/mongodb";
import { Payable } from "@/models/Payable";
import { Account } from "@/models/Account";
import type { PayableInput } from "@/lib/validations";

export async function listPayables(userId: string) {
  await connectDB();
  return Payable.find({ userId })
    .populate("paidFromAccountId", "name")
    .sort({ status: 1, dueDate: 1, createdAt: -1 })
    .lean();
}

export async function createPayable(userId: string, input: PayableInput) {
  await connectDB();
  return Payable.create({ ...input, userId, status: "PENDING" });
}

export async function updatePayable(userId: string, id: string, input: PayableInput) {
  await connectDB();
  const doc = await Payable.findOneAndUpdate(
    { _id: id, userId, status: "PENDING" },
    { $set: input },
    { new: true }
  ).lean();
  if (!doc) throw new Error("Cannot edit a paid payable, or it was not found.");
  return doc;
}

export async function deletePayable(userId: string, id: string) {
  await connectDB();
  const doc = await Payable.findOne({ _id: id, userId });
  if (!doc) throw new Error("NOT_FOUND");
  if (doc.status === "PAID" && doc.paidFromAccountId) {
    await Account.updateOne(
      { _id: doc.paidFromAccountId, userId },
      { $inc: { currentBalance: doc.amount } }
    );
  }
  await doc.deleteOne();
  return { id };
}

/** Mark a payable as paid: debit the chosen account. */
export async function markPaid(
  userId: string,
  id: string,
  paidFromAccountId: string,
  paidDate: Date
) {
  await connectDB();
  const doc = await Payable.findOne({ _id: id, userId, status: "PENDING" });
  if (!doc) throw new Error("Payable not found or already paid.");

  await Account.updateOne(
    { _id: paidFromAccountId, userId },
    { $inc: { currentBalance: -doc.amount } }
  );

  doc.status = "PAID";
  doc.paidDate = paidDate;
  doc.paidFromAccountId = paidFromAccountId as never;
  await doc.save();
  return doc.toObject();
}
