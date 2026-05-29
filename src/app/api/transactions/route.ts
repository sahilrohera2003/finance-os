import { handler, ok } from "@/lib/api";
import { transactionSchema } from "@/lib/validations";
import { listTransactions, createTransaction } from "@/server/services/transaction.service";

export const GET = handler(async ({ userId, req }) => {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const data = await listTransactions(userId, {
    type: sp.get("type") ?? undefined,
    accountId: sp.get("accountId") ?? undefined,
    categoryId: sp.get("categoryId") ?? undefined,
    tagId: sp.get("tagId") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
  });
  return ok(data);
});

export const POST = handler(async ({ userId, req }) => {
  const body = transactionSchema.parse(await req.json());
  return ok(await createTransaction(userId, body), 201);
});
