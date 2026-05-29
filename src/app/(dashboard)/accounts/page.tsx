import { getUserId } from "@/lib/session";
import { listAccounts } from "@/server/services/account.service";
import { AccountsClient } from "./accounts-client";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const userId = (await getUserId())!;
  const accounts = JSON.parse(JSON.stringify(await listAccounts(userId)));
  return <AccountsClient accounts={accounts} />;
}
