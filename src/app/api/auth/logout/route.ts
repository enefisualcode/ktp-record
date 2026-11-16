import { NextRequest, NextResponse } from "next/server";
import { expiredSessionCookie } from "@/lib/auth/session";
export async function POST(req: NextRequest) { if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Origin tidak valid" }, { status: 403 }); const res = NextResponse.json({ ok: true }); res.cookies.set(expiredSessionCookie); return res; }
