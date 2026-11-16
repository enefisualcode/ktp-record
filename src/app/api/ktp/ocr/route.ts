import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/session";
import { extractKtpWithGemini } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (req.headers.get("origin") !== req.nextUrl.origin || req.headers.get("content-type")?.includes("application/json") !== true) return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 403 });
  const length = Number(req.headers.get("content-length") || 0); if (length > 16_000_000) return NextResponse.json({ error: "Gambar terlalu besar" }, { status: 413 });
  const body = await req.json().catch(() => null); if (typeof body?.image !== "string") return NextResponse.json({ error: "Gambar tidak ditemukan" }, { status: 422 });
  try { const data = await extractKtpWithGemini(body.image); return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { const timedOut = error instanceof DOMException && error.name === "TimeoutError"; const message = timedOut ? "OCR AI melebihi batas waktu. Coba ulangi dengan foto lebih jelas." : error instanceof Error ? error.message : "OCR AI gagal"; return NextResponse.json({ error: message }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
