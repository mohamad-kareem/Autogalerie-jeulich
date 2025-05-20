// app/api/sync/route.js
import { NextResponse } from "next/server";
import { syncCars } from "@/lib/syncCars";

export async function GET(req) {
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await syncCars();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Sync error:", err);
    return new NextResponse("Sync failed", { status: 500 });
  }
}
