import { ok, fail } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import { registerUser } from "@/server/services/user.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }
    const data = await registerUser(parsed.data);
    return ok(data, 201);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to register", 400);
  }
}
