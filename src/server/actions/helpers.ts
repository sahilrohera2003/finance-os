import { z } from "zod";
import { requireUserId } from "@/lib/session";

export type ActionState<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function runAction<S extends z.ZodTypeAny, T>(
  schema: S,
  raw: unknown,
  fn: (userId: string, input: z.infer<S>) => Promise<T>
): Promise<ActionState<T>> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  try {
    const userId = await requireUserId();
    const data = await fn(userId, parsed.data);
    // Strip Mongoose internals so the result is serialisable for the client.
    return { success: true, data: JSON.parse(JSON.stringify(data)) as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    if (message === "UNAUTHORIZED") return { success: false, error: "You are not signed in." };
    return { success: false, error: message };
  }
}
