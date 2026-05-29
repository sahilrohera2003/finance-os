"use server";

import { revalidatePath } from "next/cache";
import { payableSchema, markPaidSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/payable.service";

function revalidate() {
  revalidatePath("/payables");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createPayableAction(raw: unknown) {
  const res = await runAction(payableSchema, raw, (uid, input) => service.createPayable(uid, input));
  if (res.success) revalidate();
  return res;
}

export async function updatePayableAction(id: string, raw: unknown) {
  const res = await runAction(payableSchema, raw, (uid, input) =>
    service.updatePayable(uid, id, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function markPaidAction(id: string, raw: unknown) {
  const res = await runAction(markPaidSchema, raw, (uid, input) =>
    service.markPaid(uid, id, input.paidFromAccountId, input.paidDate)
  );
  if (res.success) revalidate();
  return res;
}

export async function deletePayableAction(id: string) {
  try {
    const userId = await requireUserId();
    await service.deletePayable(userId, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}
