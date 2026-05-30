import { getUserId } from "@/lib/session";
import {
  computeSplitBalances,
  listGroupsWithSummary,
} from "@/server/services/split.service";
import { listAccounts } from "@/server/services/account.service";
import { SplitsClient } from "./splits-client";

export const dynamic = "force-dynamic";

export default async function SplitsPage() {
  const userId = (await getUserId())!;
  const [summary, groupsData, accounts] = await Promise.all([
    computeSplitBalances(userId),
    listGroupsWithSummary(userId),
    listAccounts(userId),
  ]);
  const s = (v: unknown) => JSON.parse(JSON.stringify(v));
  return (
    <SplitsClient
      summary={s(summary)}
      groups={s(groupsData.groups)}
      ungroupedCount={groupsData.ungroupedCount}
      ungroupedSummary={s(groupsData.ungroupedSummary)}
      accounts={s(accounts)}
    />
  );
}
