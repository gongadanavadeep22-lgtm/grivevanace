import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DEMO_USERS = [
  { email: "supervisor@example.com", password: "supervisor123", name: "Supervisor", role: "supervisor" },
  { email: "worker@example.com", password: "worker123", name: "Field Worker", role: "worker" },
  { email: "admin@example.com", password: "admin123", name: "Admin", role: "supervisor" },
] as const;

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-in-production";
const COOKIE_NAME = "next-auth.session-token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function getOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    let body: Record<string, string> = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = (await req.json().catch(() => ({}))) as Record<string, string>;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    }
    const email = (body.email as string)?.trim()?.toLowerCase();
    const password = (body.password as string)?.trim();
    const rawCallback = (body.callbackUrl as string)?.trim() || "/dashboard";
    const callbackUrl = rawCallback.startsWith("/") ? rawCallback : "/" + rawCallback;
    const isForm = contentType.includes("form-urlencoded");
    const origin = getOrigin(req);

    if (!email || !password) {
      if (isForm) return NextResponse.redirect(origin + "/login?error=missing");
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email && u.password === password
    );
    if (!user) {
      if (isForm) return NextResponse.redirect(origin + "/login?error=invalid");
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await encode({
      token: {
        sub: user.email,
        id: user.email,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      secret: SECRET,
      maxAge: MAX_AGE,
    });

    const cookieStore = await cookies();
    const expires = new Date(Date.now() + MAX_AGE * 1000);
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      expires,
      maxAge: MAX_AGE,
    });

    if (isForm) {
      return NextResponse.redirect(origin + (callbackUrl.startsWith("/") ? callbackUrl : "/" + callbackUrl));
    }
    return NextResponse.json({ ok: true, url: callbackUrl });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
