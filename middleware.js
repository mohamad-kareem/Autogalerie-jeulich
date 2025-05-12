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
    "/forgotpassword/:path*",
    "/forms/:path*",
    "/forms/:path*",
    "/addcar/:path*",
    "/excel/:path*",
    "/Reg/:path*",
    "/reset-password/:path*",
    "/schlussel/:path*",
    "/trello/:path*",
    "/AdminDashboard/:path*",
    "/PersonalData/:path*",
    "/Plate/:path*",
  ],
};
