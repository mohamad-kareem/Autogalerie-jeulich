import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role;

    console.log(
      "🧠 Middleware Role:",
      role,
      "| Path:",
      pathname,
      "| Invalid:",
      token?.invalidUser,
    );

    // Block deleted / invalid users
    if (!token || token.invalidUser) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Admin-only routes
    const adminOnlyPaths = [
      "/Zeiterfassungsverwaltung",
      "/excel",
      "/Reg",
      "/kaufvertrag/archiv",
    ];

    const isAdminOnly = adminOnlyPaths.some((path) =>
      pathname.startsWith(path),
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
      authorized: ({ token }) => {
        return !!token && !token.invalidUser;
      },
    },
  },
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/forms/:path*",
    "/schlussel/:path*",
    "/AdminDashboard/:path*",
    "/PersonalData/:path*",
    "/Posteingang/:path*",
    "/punsh/:path*",
    "/Zeiterfassungsverwaltung/:path*",
    "/excel/:path*",
    "/Reg/:path*",
    "/kaufvertrag",
    "/kaufvertrag/liste/:path*",
    "/kaufvertrag/auswahl/:path*",
    "/kaufvertrag/form/:path*",
    "/kaufvertrag/:id/:path*",
    "/Fahrzeugverwaltung/:path*",
    "/Autoteil/:path*",
    "/aufgabenboard/:path*",
    "/translator/:path*",
    "/Rotkennzeichen/:path*",
    "/Kundenkontakte/:path*",
  ],
};
