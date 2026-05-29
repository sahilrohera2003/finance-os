import { connectDB } from "@/lib/mongodb";
import { MonthlyObligation } from "@/models/MonthlyObligation";
import type { ObligationInput } from "@/lib/validations";

export async function listObligations(userId: string) {
  await connectDB();
  return MonthlyObligation.find({ userId }).sort({ dueDay: 1 }).lean();
}

export async function createObligation(userId: string, input: ObligationInput) {
  await connectDB();
  return MonthlyObligation.create({ ...input, userId });
}

export async function updateObligation(userId: string, id: string, input: ObligationInput) {
  await connectDB();
  const doc = await MonthlyObligation.findOneAndUpdate(
    { _id: id, userId },
    { $set: input },
    { new: true }
  ).lean();
  if (!doc) throw new Error("NOT_FOUND");
  return doc;
}

export async function deleteObligation(userId: string, id: string) {
  await connectDB();
  const res = await MonthlyObligation.findOneAndDelete({ _id: id, userId });
  if (!res) throw new Error("NOT_FOUND");
  return { id };
}
