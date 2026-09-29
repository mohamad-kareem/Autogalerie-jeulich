/**
 * Who may change the stock: the daily Vercel cron (with CRON_SECRET) or a
 * signed-in employee. Visitors of the website may only read.
 */

import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function staffSession() {
  const session = await getServerSession(authOptions).catch(() => null);
  return session?.user ? session : null;
}

export function isCron(request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
