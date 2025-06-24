import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    if (!req.nextauth.token?.isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token?.isAdmin,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/Aufgaben/:path*",

    "/forms/:path*",
    "/forms/:path*",

    "/excel/:path*",
    "/Reg/:path*",

    "/schlussel/:path*",
    "/trello/:path*",
    "/AdminDashboard/:path*",
    "/PersonalData/:path*",
    "/Plate/:path*",
    "/Posteingang/:path*",
    "/punsh/:path*",
    "/RegisterId/:path*",
  ],
};
