import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { allowedLogin, clearLoginFailures, recordLoginFailure } from "@/lib/auth/rate-limit";
import { createSession, sessionCookie } from "@/lib/auth/session";
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 });
  if (!process.env.APP_PASSWORD || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return NextResponse.json({ error: "Login belum dikonfigurasi di Vercel. Isi APP_PASSWORD dan SESSION_SECRET lalu redeploy." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!allowedLogin(ip)) return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi 15 menit." }, { status: 429 });
  const { password } = await req.json().catch(() => ({})); const expected = process.env.APP_PASSWORD;
  const supplied = typeof password === "string" ? Buffer.from(password) : Buffer.alloc(0); const configured = Buffer.from(expected);
  const valid = supplied.length === configured.length && crypto.timingSafeEqual(supplied, configured);
  if (typeof password !== "string" || password.length > 200 || !valid) { recordLoginFailure(ip); return NextResponse.json({ error: "Password tidak valid" }, { status: 401 }); }
  clearLoginFailures(ip); const res = NextResponse.json({ ok: true }); res.cookies.set(sessionCookie(createSession())); return res;
}
