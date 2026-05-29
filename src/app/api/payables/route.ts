import { handler, ok } from "@/lib/api";
import { payableSchema } from "@/lib/validations";
import { listPayables, createPayable } from "@/server/services/payable.service";

export const GET = handler(async ({ userId }) => ok(await listPayables(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = payableSchema.parse(await req.json());
  return ok(await createPayable(userId, body), 201);
});
