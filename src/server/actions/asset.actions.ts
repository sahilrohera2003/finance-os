"use server";

import { revalidatePath } from "next/cache";
import { assetSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/asset.service";
import { createSnapshot } from "@/server/services/networth.service";

function revalidate() {
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

export async function createAssetAction(raw: unknown) {
  const res = await runAction(assetSchema, raw, async (uid, input) => {
    const asset = await service.createAsset(uid, input);
    await createSnapshot(uid);
    return asset;
  });
  if (res.success) revalidate();
  return res;
}

export async function updateAssetAction(id: string, raw: unknown) {
  const res = await runAction(assetSchema, raw, (uid, input) => service.updateAsset(uid, id, input));
  if (res.success) revalidate();
  return res;
}

export async function deleteAssetAction(id: string) {
  try {
    const userId = await requireUserId();
    await service.deleteAsset(userId, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to delete." };
  }
}
