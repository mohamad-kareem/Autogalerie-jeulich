// app/api/sync/route.js
import { NextResponse } from "next/server";
import { syncCars } from "@/lib/syncCars"; // adjust path if needed

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  // simple token check to prevent unauthorized hits
  if (searchParams.get("token") !== process.env.SYNC_TOKEN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    await syncCars();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Sync failed:", err);
    return new NextResponse("Sync error", { status: 500 });
  }
}
