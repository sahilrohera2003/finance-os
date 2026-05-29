"use server";

import { revalidatePath } from "next/cache";
import { profileSchema, changePasswordSchema, registerSchema } from "@/lib/validations";
import { runAction } from "./helpers";
import * as service from "@/server/services/user.service";

export async function registerAction(raw: unknown) {
  // Registration has no session yet, so we don't use runAction's auth wrapper.
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  try {
    const data = await service.registerUser(parsed.data);
    return { success: true as const, data };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : "Failed to register." };
  }
}

export async function updateProfileAction(raw: unknown) {
  const res = await runAction(profileSchema, raw, (uid, input) =>
    service.updateProfile(uid, input)
  );
  if (res.success) revalidatePath("/settings");
  return res;
}

export async function changePasswordAction(raw: unknown) {
  return runAction(changePasswordSchema, raw, (uid, input) =>
    service.changePassword(uid, input.currentPassword, input.newPassword)
  );
}
