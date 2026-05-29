import { connectDB } from "@/lib/mongodb";
import { Receivable } from "@/models/Receivable";
import { Account } from "@/models/Account";
import type { ReceivableInput } from "@/lib/validations";

export async function listReceivables(userId: string) {
  await connectDB();
  return Receivable.find({ userId })
    .populate("receivedToAccountId", "name")
    .sort({ status: 1, expectedDate: 1, createdAt: -1 })
    .lean();
}

export async function createReceivable(userId: string, input: ReceivableInput) {
  await connectDB();
  return Receivable.create({ ...input, userId, status: "PENDING" });
}

export async function updateReceivable(userId: string, id: string, input: ReceivableInput) {
  await connectDB();
  const doc = await Receivable.findOneAndUpdate(
    { _id: id, userId, status: "PENDING" },
    { $set: input },
    { new: true }
  ).lean();
  if (!doc) throw new Error("Cannot edit a received receivable, or it was not found.");
  return doc;
}

export async function deleteReceivable(userId: string, id: string) {
  await connectDB();
  const doc = await Receivable.findOne({ _id: id, userId });
  if (!doc) throw new Error("NOT_FOUND");
  // If it was already received, reverse the balance addition.
  if (doc.status === "RECEIVED" && doc.receivedToAccountId) {
    await Account.updateOne(
      { _id: doc.receivedToAccountId, userId },
      { $inc: { currentBalance: -doc.amount } }
    );
  }
  await doc.deleteOne();
  return { id };
}

/** Mark a receivable as received: credit the chosen account. */
export async function markReceived(
  userId: string,
  id: string,
  accountId: string,
  receivedDate: Date
) {
  await connectDB();
  const doc = await Receivable.findOne({ _id: id, userId, status: "PENDING" });
  if (!doc) throw new Error("Receivable not found or already received.");

  await Account.updateOne(
    { _id: accountId, userId },
    { $inc: { currentBalance: doc.amount } }
  );

  doc.status = "RECEIVED";
  doc.receivedDate = receivedDate;
  doc.receivedToAccountId = accountId as never;
  await doc.save();
  return doc.toObject();
}
