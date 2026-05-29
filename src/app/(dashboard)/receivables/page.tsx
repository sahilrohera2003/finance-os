import { getUserId } from "@/lib/session";
import { listReceivables } from "@/server/services/receivable.service";
import { listAccounts } from "@/server/services/account.service";
import { ReceivablesClient } from "./receivables-client";

export const dynamic = "force-dynamic";

export default async function ReceivablesPage() {
  const userId = (await getUserId())!;
  const [receivables, accounts] = await Promise.all([
    listReceivables(userId),
    listAccounts(userId),
  ]);
  const s = (v: unknown) => JSON.parse(JSON.stringify(v));
  return <ReceivablesClient receivables={s(receivables)} accounts={s(accounts)} />;
}
