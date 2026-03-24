import { NextRequest, NextResponse } from "next/server";
import { getRequestAdminAuthorization } from "@/lib/admin-access";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/admin/unauthorized" ||
    pathname.startsWith("/admin/unauthorized/")
  ) {
    return NextResponse.next();
  }

  const authorization = await getRequestAdminAuthorization(request);

  if (authorization.status === "authorized") {
    return NextResponse.next();
  }

  const destination = authorization.status === "unauthenticated" ? "/admin/login" : "/admin/unauthorized";
  return NextResponse.redirect(new URL(destination, request.url));
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*"]
};
