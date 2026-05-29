import { handler, ok } from "@/lib/api";
import { markPaidSchema } from "@/lib/validations";
import { markPaid } from "@/server/services/payable.service";

export const POST = handler(async ({ userId, req, params }) => {
  const body = markPaidSchema.parse(await req.json());
  return ok(await markPaid(userId, params.id, body.paidFromAccountId, body.paidDate));
});
