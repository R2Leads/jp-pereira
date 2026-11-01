import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { LocatorError } from "./domain.ts";
const derive = promisify(scrypt);
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2]) || password.length > 256) return false;
  const actual = await derive(password, parts[1], 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(parts[2], "hex"));
}
export function assertLocalRequest(request: Request, local: boolean) {
  if (!local) return;
  const url = new URL(request.url);
  const actualHost = request.headers.get("host");
  let hostname = url.hostname;
  try { if (actualHost) hostname = new URL(url.protocol + "//" + actualHost).hostname; } catch { hostname = "invalid"; }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname)) throw new LocatorError("Esta demonstração aceita apenas acesso local.", 403, "LOCAL_ONLY");
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const expected = host ? url.protocol + "//" + host : url.origin;
  if (!origin || origin !== expected) throw new LocatorError("Origem da requisição não autorizada.", 403, "INVALID_ORIGIN");
}
const windows = new Map<string, { count: number; until: number }>();
export function takeRateLimit(key: string, max: number, windowMs: number, now = Date.now()) {
  if (windows.size > 1000) for (const [id, value] of windows) if (value.until <= now) windows.delete(id);
  const current = windows.get(key);
  if (!current || current.until <= now) { windows.set(key, {count:1,until:now+windowMs}); return true; }
  if (current.count >= max) return false;
  current.count++; return true;
}


