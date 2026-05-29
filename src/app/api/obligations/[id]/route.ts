import { handler, ok } from "@/lib/api";
import { obligationSchema } from "@/lib/validations";
import { updateObligation, deleteObligation } from "@/server/services/obligation.service";

export const PUT = handler(async ({ userId, req, params }) => {
  const body = obligationSchema.parse(await req.json());
  return ok(await updateObligation(userId, params.id, body));
});

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteObligation(userId, params.id))
);
