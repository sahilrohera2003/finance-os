"use server";

import { revalidatePath } from "next/cache";
import { obligationSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/obligation.service";

function revalidate() {
  revalidatePath("/obligations");
  revalidatePath("/dashboard");
}

export async function createObligationAction(raw: unknown) {
  const res = await runAction(obligationSchema, raw, (uid, input) =>
    service.createObligation(uid, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function updateObligationAction(id: string, raw: unknown) {
  const res = await runAction(obligationSchema, raw, (uid, input) =>
    service.updateObligation(uid, id, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function deleteObligationAction(id: string) {
  try {
    const userId = await requireUserId();
    await service.deleteObligation(userId, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}
