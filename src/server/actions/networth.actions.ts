"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/session";
import { resetSnapshots } from "@/server/services/networth.service";

export async function resetNetWorthHistoryAction() {
  try {
    const userId = await requireUserId();
    await resetSnapshots(userId);
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { success: true as const, data: { ok: true } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to reset." };
  }
}
