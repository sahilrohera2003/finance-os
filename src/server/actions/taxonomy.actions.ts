"use server";

import { revalidatePath } from "next/cache";
import { categorySchema, tagSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import { requireUserId } from "@/lib/session";
import * as service from "@/server/services/taxonomy.service";

function revalidate() {
  revalidatePath("/transactions");
  revalidatePath("/settings");
}

export async function createCategoryAction(raw: unknown) {
  const res = await runAction(categorySchema, raw, (uid, input) =>
    service.createCategory(uid, input)
  );
  if (res.success) revalidate();
  return res;
}

export async function deleteCategoryAction(id: string) {
  try {
    const uid = await requireUserId();
    await service.deleteCategory(uid, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function createTagAction(raw: unknown) {
  const res = await runAction(tagSchema, raw, (uid, input) => service.createTag(uid, input));
  if (res.success) revalidate();
  return res;
}

export async function deleteTagAction(id: string) {
  try {
    const uid = await requireUserId();
    await service.deleteTag(uid, id);
    revalidate();
    return { success: true as const, data: { id } };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}
