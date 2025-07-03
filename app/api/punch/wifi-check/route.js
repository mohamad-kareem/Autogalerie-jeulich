// app/api/punch/wifi-check/route.js
export async function GET(req) {
  const ip = req.headers.get("x-forwarded-for") || req.ip || "0.0.0.0";

  // Check if IP is from local network (IPv4 range like 192.168.x.x or 10.x.x.x)
  const isLocal =
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.") ||
    ip === "::1" ||
    ip === "127.0.0.1";

  if (isLocal) {
    return Response.json({ success: true });
  }

  return Response.json({ success: false }, { status: 403 });
}
