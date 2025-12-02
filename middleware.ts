// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
    const exp = payload.exp;

    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return now > exp;
  } catch {
    return true; // invalid token → logout
  }
}

function logoutAndRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.delete("auth_token");
  response.cookies.delete("user_data");
  response.cookies.delete("user_menu");

  return response;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value || null;
  const pathname = request.nextUrl.pathname;

  const isLogin = pathname === "/login";
  const isDashboard = pathname.startsWith("/dashboard");

  // --- LOGOUT automático si token expiró ---
  if (token && isTokenExpired(token)) {
    return logoutAndRedirect(request);
  }

  // --- Si entra a login con token válido → manda a dashboard ---
  if (isLogin && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- Si no tiene token y quiere entrar al dashboard → login ---
  if (isDashboard && !token) {
    return logoutAndRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
