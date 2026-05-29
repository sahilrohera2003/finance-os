import { handler, ok } from "@/lib/api";
import { loanSchema } from "@/lib/validations";
import { listLoans, createLoan } from "@/server/services/loan.service";

export const GET = handler(async ({ userId }) => ok(await listLoans(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = loanSchema.parse(await req.json());
  return ok(await createLoan(userId, body), 201);
});
