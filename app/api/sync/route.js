import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { isCron, staffSession } from "@/lib/cars/auth";
import { syncCars } from "@/lib/syncCars";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/sync — copies the mobile.de ads into the website.
 * Called daily by the Vercel cron (Bearer CRON_SECRET) or by a signed-in
 * employee with the "Aktualisieren" button. Nobody else.
 */
export async function GET(request) {
  if (!isCron(request) && !(await staffSession())) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  try {
    const result = await syncCars();
    revalidatePath("/gebrauchtwagen");
    revalidatePath("/gebrauchtwagen/[id]", "page");
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("mobile.de sync failed:", error?.message);
    return NextResponse.json({ success: false, error: error?.message || "Abgleich fehlgeschlagen." }, { status: 500 });
  }
}
