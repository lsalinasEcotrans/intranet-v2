// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token");
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  // Si está en login y tiene token, redirigir a dashboard
  if (isLoginPage && authToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si intenta acceder a dashboard sin token, redirigir a login
  if (isDashboard && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
