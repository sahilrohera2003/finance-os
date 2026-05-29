import { handler, ok } from "@/lib/api";
import { receivableSchema } from "@/lib/validations";
import { listReceivables, createReceivable } from "@/server/services/receivable.service";

export const GET = handler(async ({ userId }) => ok(await listReceivables(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = receivableSchema.parse(await req.json());
  return ok(await createReceivable(userId, body), 201);
});
