import { handler, ok } from "@/lib/api";
import { markReceivedSchema } from "@/lib/validations";
import { markReceived } from "@/server/services/receivable.service";

export const POST = handler(async ({ userId, req, params }) => {
  const body = markReceivedSchema.parse(await req.json());
  return ok(await markReceived(userId, params.id, body.accountId, body.receivedDate));
});
