import { getUserId } from "@/lib/session";
import { listObligations } from "@/server/services/obligation.service";
import { ObligationsClient } from "./obligations-client";

export const dynamic = "force-dynamic";

export default async function ObligationsPage() {
  const userId = (await getUserId())!;
  const obligations = JSON.parse(JSON.stringify(await listObligations(userId)));
  return <ObligationsClient obligations={obligations} />;
}
