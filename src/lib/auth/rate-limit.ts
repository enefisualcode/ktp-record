const attempts = new Map<string, { count: number; reset: number }>();
export function allowedLogin(ip: string) { const now = Date.now(); const v = attempts.get(ip); if (!v || v.reset < now) return true; return v.count < 5; }
export function recordLoginFailure(ip: string) { const now = Date.now(); const v = attempts.get(ip); if (!v || v.reset < now) attempts.set(ip, { count: 1, reset: now + 15 * 60_000 }); else v.count++; }
export function clearLoginFailures(ip: string) { attempts.delete(ip); }
