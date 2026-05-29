import { handler, ok } from "@/lib/api";
import { accountSchema } from "@/lib/validations";
import { getAccount, updateAccount, deleteAccount } from "@/server/services/account.service";

export const GET = handler(async ({ userId, params }) =>
  ok(await getAccount(userId, params.id))
);

export const PUT = handler(async ({ userId, req, params }) => {
  const body = accountSchema.parse(await req.json());
  return ok(await updateAccount(userId, params.id, body));
});

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteAccount(userId, params.id))
);
