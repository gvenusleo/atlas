import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const authSessionCookieName = "atlas_session";

const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;
const sessionRefreshIntervalMs = 24 * 60 * 60 * 1000;

export function createSessionExpiry(now = new Date()) {
  return new Date(now.getTime() + sessionDurationMs);
}

export function shouldRefreshSession(lastSeenAt: Date, now = new Date()) {
  return now.getTime() - lastSeenAt.getTime() >= sessionRefreshIntervalMs;
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function readSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(authSessionCookieName)?.value ?? null;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(authSessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(authSessionCookieName);
}
