import { getUserId } from "@/lib/session";
import { listTransactions } from "@/server/services/transaction.service";
import { listAccounts } from "@/server/services/account.service";
import { listCategories, listTags } from "@/server/services/taxonomy.service";
import { TransactionsClient } from "./transactions-client";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = (await getUserId())!;
  const sp = await searchParams;

  const [transactions, accounts, categories, tags] = await Promise.all([
    listTransactions(userId, {
      type: sp.type,
      accountId: sp.accountId,
      categoryId: sp.categoryId,
      tagId: sp.tagId,
      from: sp.from,
      to: sp.to,
    }),
    listAccounts(userId),
    listCategories(userId),
    listTags(userId),
  ]);

  const s = (v: unknown) => JSON.parse(JSON.stringify(v));

  return (
    <TransactionsClient
      transactions={s(transactions)}
      accounts={s(accounts)}
      categories={s(categories)}
      tags={s(tags)}
      filters={sp}
    />
  );
}
