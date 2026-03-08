import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is disabled so all pages work without login. Dashboard, Supervisor, Worker are open.
// To require login again, set REQUIRE_AUTH=true in .env and uncomment the block below.
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === "true";

export async function middleware(req: NextRequest) {
  if (!REQUIRE_AUTH) return NextResponse.next();

  // Optional: re-enable auth by uncommenting and adding getToken back:
  // const token = await getToken({ req, secret: process.env.AUTH_SECRET, cookieName: "next-auth.session-token" });
  // if (!token) return NextResponse.redirect(new URL("/login?callbackUrl=" + req.nextUrl.pathname, req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard", "/dashboard/:path*", "/supervisor", "/supervisor/:path*", "/worker", "/worker/:path*"] };
