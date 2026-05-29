import { handler, ok } from "@/lib/api";
import { obligationSchema } from "@/lib/validations";
import { listObligations, createObligation } from "@/server/services/obligation.service";

export const GET = handler(async ({ userId }) => ok(await listObligations(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = obligationSchema.parse(await req.json());
  return ok(await createObligation(userId, body), 201);
});
