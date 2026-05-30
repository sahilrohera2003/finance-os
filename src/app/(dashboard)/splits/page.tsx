import { getUserId } from "@/lib/session";
import {
  listSplitExpenses,
  listSettlements,
  computeSplitBalances,
} from "@/server/services/split.service";
import { listAccounts } from "@/server/services/account.service";
import { SplitsClient } from "./splits-client";

export const dynamic = "force-dynamic";

export default async function SplitsPage() {
  const userId = (await getUserId())!;
  const [expenses, settlements, summary, accounts] = await Promise.all([
    listSplitExpenses(userId),
    listSettlements(userId),
    computeSplitBalances(userId),
    listAccounts(userId),
  ]);
  const s = (v: unknown) => JSON.parse(JSON.stringify(v));
  return (
    <SplitsClient
      expenses={s(expenses)}
      settlements={s(settlements)}
      summary={s(summary)}
      accounts={s(accounts)}
    />
  );
}
