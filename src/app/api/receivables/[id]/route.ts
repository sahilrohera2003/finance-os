import { handler, ok } from "@/lib/api";
import { receivableSchema } from "@/lib/validations";
import { updateReceivable, deleteReceivable } from "@/server/services/receivable.service";

export const PUT = handler(async ({ userId, req, params }) => {
  const body = receivableSchema.parse(await req.json());
  return ok(await updateReceivable(userId, params.id, body));
});

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteReceivable(userId, params.id))
);
