import { getUserId } from "@/lib/session";
import { listLoans } from "@/server/services/loan.service";
import { LoansClient } from "./loans-client";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const userId = (await getUserId())!;
  const loans = JSON.parse(JSON.stringify(await listLoans(userId)));
  return <LoansClient loans={loans} />;
}
