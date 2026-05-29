import { handler, ok } from "@/lib/api";
import { deleteTransaction } from "@/server/services/transaction.service";

export const DELETE = handler(async ({ userId, params }) =>
  ok(await deleteTransaction(userId, params.id))
);
