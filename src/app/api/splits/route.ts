import { handler, ok } from "@/lib/api";
import { splitExpenseSchema } from "@/lib/validations";
import {
  listSplitExpenses,
  createSplitExpense,
  computeSplitBalances,
} from "@/server/services/split.service";

export const GET = handler(async ({ userId, req }) => {
  const url = new URL(req.url);
  if (url.searchParams.get("view") === "balances") {
    return ok(await computeSplitBalances(userId));
  }
  return ok(await listSplitExpenses(userId));
});

export const POST = handler(async ({ userId, req }) => {
  const body = splitExpenseSchema.parse(await req.json());
  return ok(await createSplitExpense(userId, body), 201);
});
