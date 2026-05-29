import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getUserId } from "@/lib/session";

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: Record<string, string[]> };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResult<T>>({ success: true, data }, { status });
}

export function fail(error: string, status = 400, issues?: Record<string, string[]>) {
  return NextResponse.json<ApiResult<never>>(
    { success: false, error, ...(issues ? { issues } : {}) },
    { status }
  );
}

/** Wrap a route handler: ensures auth, injects userId, maps errors. */
export function handler(
  fn: (ctx: { userId: string; req: Request; params: Record<string, string> }) => Promise<NextResponse | Response>
) {
  return async (
    req: Request,
    context: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const userId = await getUserId();
      if (!userId) return fail("Unauthorized", 401);
      const rawParams = context?.params
        ? await context.params
        : ({} as Record<string, string>);
      return await fn({ userId, req, params: rawParams });
    } catch (err) {
      if (err instanceof ZodError) {
        return fail("Validation failed", 422, err.flatten().fieldErrors as Record<string, string[]>);
      }
      const message = err instanceof Error ? err.message : "Internal Server Error";
      if (message === "UNAUTHORIZED") return fail("Unauthorized", 401);
      if (message === "NOT_FOUND") return fail("Not found", 404);
      console.error("[API ERROR]", err);
      return fail(message, 500);
    }
  };
}
