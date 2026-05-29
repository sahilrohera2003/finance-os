"use server";

import { revalidatePath } from "next/cache";
import { receivableSchema, markReceivedSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/receivable.service";

function revalidate() {
  revalidatePath("/receivables");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createReceivableAction(raw: unknown) {
  const res = await runAction(receivableSchema, raw, (uid, input) =>
    service.createReceivable(uid, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function updateReceivableAction(id: string, raw: unknown) {
  const res = await runAction(receivableSchema, raw, (uid, input) =>
    service.updateReceivable(uid, id, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function markReceivedAction(id: string, raw: unknown) {
  const res = await runAction(markReceivedSchema, raw, (uid, input) =>
    service.markReceived(uid, id, input.accountId, input.receivedDate)
  );
  if (res.success) revalidate();
  return res;
}

export async function deleteReceivableAction(id: string) {
  try {
    const userId = await requireUserId();
    await service.deleteReceivable(userId, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}
