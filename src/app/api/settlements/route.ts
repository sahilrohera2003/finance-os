import { handler, ok } from "@/lib/api";
import { settlementSchema } from "@/lib/validations";
import { listSettlements, createSettlement } from "@/server/services/split.service";

export const GET = handler(async ({ userId }) => ok(await listSettlements(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = settlementSchema.parse(await req.json());
  return ok(await createSettlement(userId, body), 201);
});
