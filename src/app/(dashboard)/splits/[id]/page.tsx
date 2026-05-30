import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import {
  getGroupDetail,
  listGroups,
  UNGROUPED,
} from "@/server/services/split.service";
import { listAccounts } from "@/server/services/account.service";
import { GroupClient } from "./group-client";

export const dynamic = "force-dynamic";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id !== UNGROUPED && !OBJECT_ID.test(id)) notFound();

  const userId = (await getUserId())!;

  let detail;
  try {
    detail = await getGroupDetail(userId, id);
  } catch {
    notFound();
  }

  const [groups, accounts] = await Promise.all([listGroups(userId), listAccounts(userId)]);
  const s = (v: unknown) => JSON.parse(JSON.stringify(v));

  return (
    <GroupClient
      scope={id}
      group={s(detail!.group)}
      expenses={s(detail!.expenses)}
      settlements={s(detail!.settlements)}
      summary={s(detail!.summary)}
      groups={s(groups)}
      accounts={s(accounts)}
    />
  );
}
