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
    "/AdminDashboard/:path*",
    "/admin/:path*",
    "/addcar/:path*",
    "/excel/:path*",
    "/Reg/:path*",
  ],
};
