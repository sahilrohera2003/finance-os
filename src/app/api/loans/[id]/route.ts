import { handler, ok } from "@/lib/api";
import { loanSchema } from "@/lib/validations";
import { updateLoan, deleteLoan } from "@/server/services/loan.service";

export const PUT = handler(async ({ userId, req, params }) => {
  const body = loanSchema.parse(await req.json());
  return ok(await updateLoan(userId, params.id, body));
});

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteLoan(userId, params.id))
);
