import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED = [
  "/dashboard",
  "/calendar",
  "/services",
  "/customers",
  "/settings",
  "/api/services",
  "/api/customers",
  "/api/appointments",
  "/api/dashboard",
  "/api/tenant",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!needAuth) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/services/:path*",
    "/customers/:path*",
    "/settings/:path*",
    "/api/services/:path*",
    "/api/customers/:path*",
    "/api/appointments/:path*",
    "/api/dashboard/:path*",
    "/api/tenant/:path*",
  ],
};
