import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected Dashboard Routes
  if (pathname.startsWith("/dashboard")) {
    const adminSessionCookie = request.cookies.get("rcms_admin_session")?.value;
    const hasSupabaseAuthCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

    // Redirect to /login if neither session cookie nor Supabase auth token is present
    if (!adminSessionCookie && !hasSupabaseAuthCookie) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard"],
};
