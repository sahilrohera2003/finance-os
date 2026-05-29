import { handler, ok } from "@/lib/api";
import { computeNetWorth, createSnapshot, listSnapshots } from "@/server/services/networth.service";

export const GET = handler(async ({ userId }) => {
  const [breakdown, snapshots] = await Promise.all([
    computeNetWorth(userId),
    listSnapshots(userId),
  ]);
  return ok({ breakdown, snapshots });
});

// Persist a fresh snapshot on demand.
export const POST = handler(async ({ userId }) => ok(await createSnapshot(userId), 201));
