import { handler, ok } from "@/lib/api";
import { payableSchema } from "@/lib/validations";
import { updatePayable, deletePayable } from "@/server/services/payable.service";

export const PUT = handler(async ({ userId, req, params }) => {
  const body = payableSchema.parse(await req.json());
  return ok(await updatePayable(userId, params.id, body));
});

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deletePayable(userId, params.id))
);
