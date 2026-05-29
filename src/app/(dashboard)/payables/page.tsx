import { getUserId } from "@/lib/session";
import { listPayables } from "@/server/services/payable.service";
import { listAccounts } from "@/server/services/account.service";
import { PayablesClient } from "./payables-client";

export const dynamic = "force-dynamic";

export default async function PayablesPage() {
  const userId = (await getUserId())!;
  const [payables, accounts] = await Promise.all([
    listPayables(userId),
    listAccounts(userId),
  ]);
  const s = (v: unknown) => JSON.parse(JSON.stringify(v));
  return <PayablesClient payables={s(payables)} accounts={s(accounts)} />;
}
