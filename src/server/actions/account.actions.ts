"use server";

import { revalidatePath } from "next/cache";
import { accountSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/account.service";
import { createSnapshot } from "@/server/services/networth.service";

function revalidate() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function createAccountAction(raw: unknown) {
  const res = await runAction(accountSchema, raw, async (userId, input) => {
    const account = await service.createAccount(userId, input);
    await createSnapshot(userId);
    return account;
  });
  if (res.success) revalidate();
  return res;
}

export async function updateAccountAction(id: string, raw: unknown) {
  const res = await runAction(accountSchema, raw, (userId, input) =>
    service.updateAccount(userId, id, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function deleteAccountAction(id: string) {
  try {
    const userId = await requireUserId();
    await service.deleteAccount(userId, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}
