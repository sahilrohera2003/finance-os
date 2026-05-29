import { connectDB } from "@/lib/mongodb";
import { Loan } from "@/models/Loan";
import type { LoanInput } from "@/lib/validations";

export async function listLoans(userId: string) {
  await connectDB();
  return Loan.find({ userId }).sort({ status: 1, nextDueDate: 1 }).lean();
}

export async function createLoan(userId: string, input: LoanInput) {
  await connectDB();
  return Loan.create({ ...input, userId });
}

export async function updateLoan(userId: string, id: string, input: LoanInput) {
  await connectDB();
  const patch = {
    ...input,
    // Auto-close when fully paid off.
    status: input.outstandingAmount <= 0 ? "CLOSED" : input.status,
  };
  const doc = await Loan.findOneAndUpdate({ _id: id, userId }, { $set: patch }, { new: true }).lean();
  if (!doc) throw new Error("NOT_FOUND");
  return doc;
}

export async function deleteLoan(userId: string, id: string) {
  await connectDB();
  const res = await Loan.findOneAndDelete({ _id: id, userId });
  if (!res) throw new Error("NOT_FOUND");
  return { id };
}
