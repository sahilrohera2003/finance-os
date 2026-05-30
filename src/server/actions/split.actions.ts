"use server";

import { revalidatePath } from "next/cache";
import { splitExpenseSchema, settlementSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/split.service";

function revalidate() {
  revalidatePath("/splits");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createSplitExpenseAction(raw: unknown) {
  const res = await runAction(splitExpenseSchema, raw, (uid, input) =>
    service.createSplitExpense(uid, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function deleteSplitExpenseAction(id: string) {
  try {
    const uid = await requireUserId();
    await service.deleteSplitExpense(uid, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}

export async function createSettlementAction(raw: unknown) {
  const res = await runAction(settlementSchema, raw, (uid, input) =>
    service.createSettlement(uid, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function deleteSettlementAction(id: string) {
  try {
    const uid = await requireUserId();
    await service.deleteSettlement(uid, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}
