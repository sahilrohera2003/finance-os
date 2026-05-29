"use server";

import { revalidatePath } from "next/cache";
import { transactionSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/transaction.service";

function revalidate() {
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createTransactionAction(raw: unknown) {
  const res = await runAction(transactionSchema, raw, (userId, input) =>
    service.createTransaction(userId, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function deleteTransactionAction(id: string) {
  try {
    const userId = await requireUserId();
    await service.deleteTransaction(userId, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}
