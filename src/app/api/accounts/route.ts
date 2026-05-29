import { handler, ok } from "@/lib/api";
import { accountSchema } from "@/lib/validations";
import { listAccounts, createAccount } from "@/server/services/account.service";

export const GET = handler(async ({ userId }) => ok(await listAccounts(userId)));

export const POST = handler(async ({ userId, req }) => {
  const body = accountSchema.parse(await req.json());
  return ok(await createAccount(userId, body), 201);
});
