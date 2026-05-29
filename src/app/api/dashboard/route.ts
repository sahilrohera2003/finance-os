import { handler, ok } from "@/lib/api";
import { getDashboard } from "@/server/services/analytics.service";

export const GET = handler(async ({ userId }) => ok(await getDashboard(userId)));
