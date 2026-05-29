"use server";

import { revalidatePath } from "next/cache";
import { loanSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/loan.service";

function revalidate() {
  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

export async function createLoanAction(raw: unknown) {
  const res = await runAction(loanSchema, raw, (uid, input) => service.createLoan(uid, input));
  if (res.success) revalidate();
  return res;
}

export async function updateLoanAction(id: string, raw: unknown) {
  const res = await runAction(loanSchema, raw, (uid, input) => service.updateLoan(uid, id, input));
  if (res.success) revalidate();
  return res;
}

export async function deleteLoanAction(id: string) {
  try {
    const userId = await requireUserId();
    await service.deleteLoan(userId, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}
