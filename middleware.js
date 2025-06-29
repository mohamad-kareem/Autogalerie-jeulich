import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // 🔍 DEBUG LOG
    console.log("🧠 Middleware Role:", role, "| Path:", pathname);

    // 🔒 Admin-only routes
    const adminOnlyPaths = ["/Zeiterfassungsverwaltung", "/excel", "/Reg"];
    const isAdminOnly = adminOnlyPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (isAdminOnly && role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/Aufgaben/:path*",
    "/forms/:path*",
    "/schlussel/:path*",
    "/trello/:path*",
    "/AdminDashboard/:path*",
    "/PersonalData/:path*",
    "/Plate/:path*",
    "/Posteingang/:path*",
    "/punsh/:path*",
    "/Zeiterfassungsverwaltung/:path*",
    "/excel/:path*",
    "/Reg/:path*",
    "/kaufvertrag",
  ],
};
