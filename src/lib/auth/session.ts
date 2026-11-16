import crypto from "crypto";
import { cookies } from "next/headers";
const NAME = "ktp_session"; const MAX_AGE = 60 * 60 * 8;
function secret() { const s = process.env.SESSION_SECRET; if (!s || s.length < 32) throw new Error("SESSION_SECRET belum dikonfigurasi atau terlalu pendek"); return s; }
function sign(value: string) { return crypto.createHmac("sha256", secret()).update(value).digest("base64url"); }
export function createSession() { const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000, nonce: crypto.randomUUID() })).toString("base64url"); return `${payload}.${sign(payload)}`; }
export function verifySession(token?: string) { if (!token) return false; const [payload, mac] = token.split("."); if (!payload || !mac) return false; const expected = sign(payload); if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false; try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); } catch { return false; } }
export async function isAuthenticated() { return verifySession((await cookies()).get(NAME)?.value); }
export const sessionCookie = (value: string) => ({ name: NAME, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: MAX_AGE, path: "/" });
export const expiredSessionCookie = { name: NAME, value: "", httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" };
