import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected Dashboard Routes
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie = request.cookies.get("rcms_admin_session")?.value;

    if (!sessionCookie || sessionCookie !== "authenticated") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard"],
};
