import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "./password";
import {
  clearSessionCookie,
  createSessionExpiry,
  createSessionToken,
  hashSessionToken,
  readSessionToken,
  setSessionCookie,
  shouldRefreshSession,
} from "./session";
import type {
  AuthResult,
  AuthSession,
  SignInWithPasswordInput,
  SignUpWithPasswordInput,
} from "./types";

type SessionRecord = {
  expiresAt: Date;
  lastSeenAt: Date;
  sessionCreatedAt: Date;
  sessionId: string;
  userEmail: string;
  userId: string;
  userName: string;
};

function invalidCredentialsResult(): AuthResult {
  return {
    code: "INVALID_CREDENTIALS",
    message: "邮箱或密码不正确。",
    ok: false,
  };
}

function emailAlreadyExistsResult(): AuthResult {
  return {
    code: "EMAIL_ALREADY_EXISTS",
    message: "该邮箱已被注册，请直接登录。",
    ok: false,
  };
}

function buildAuthSession(
  record: Pick<
    SessionRecord,
    "sessionCreatedAt" | "userEmail" | "userId" | "userName"
  >,
): AuthSession {
  return {
    createdAt: record.sessionCreatedAt.toISOString(),
    user: {
      email: record.userEmail,
      id: record.userId,
      name: record.userName,
    },
  };
}

async function getSessionRecordByToken(rawToken: string) {
  const db = getDb();
  const [record] = await db
    .select({
      expiresAt: sessions.expiresAt,
      lastSeenAt: sessions.lastSeenAt,
      sessionCreatedAt: sessions.createdAt,
      sessionId: sessions.id,
      userEmail: users.email,
      userId: users.id,
      userName: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, hashSessionToken(rawToken)))
    .limit(1);

  if (!record) {
    return null;
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, record.sessionId));
    return null;
  }

  return record satisfies SessionRecord;
}

function createSessionInsert(userId: string, now = new Date()) {
  const expiresAt = createSessionExpiry(now);
  const rawToken = createSessionToken();

  return {
    cookieToken: rawToken,
    expiresAt,
    values: {
      id: randomUUID(),
      userId,
      tokenHash: hashSessionToken(rawToken),
      expiresAt,
      lastSeenAt: now,
      createdAt: now,
    },
  };
}

export async function getSession() {
  const rawToken = await readSessionToken();

  if (!rawToken) {
    return null;
  }

  const sessionRecord = await getSessionRecordByToken(rawToken);
  return sessionRecord ? buildAuthSession(sessionRecord) : null;
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return session;
}

export async function refreshSession() {
  const rawToken = await readSessionToken();

  if (!rawToken) {
    return false;
  }

  const sessionRecord = await getSessionRecordByToken(rawToken);

  if (!sessionRecord) {
    await clearSessionCookie();
    return false;
  }

  if (!shouldRefreshSession(sessionRecord.lastSeenAt)) {
    return true;
  }

  const db = getDb();
  const now = new Date();
  const expiresAt = createSessionExpiry(now);

  await db
    .update(sessions)
    .set({
      expiresAt,
      lastSeenAt: now,
    })
    .where(eq(sessions.id, sessionRecord.sessionId));

  await setSessionCookie(rawToken, expiresAt);
  return true;
}

export async function signInWithPassword(
  input: SignInWithPasswordInput,
): Promise<AuthResult> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const [user] = await db
    .select({
      email: users.email,
      id: users.id,
      name: users.name,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return invalidCredentialsResult();
  }

  const isPasswordValid = await verifyPassword(
    input.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    return invalidCredentialsResult();
  }

  const sessionInsert = createSessionInsert(user.id);

  await db.insert(sessions).values(sessionInsert.values);
  await setSessionCookie(sessionInsert.cookieToken, sessionInsert.expiresAt);

  return {
    ok: true,
    session: buildAuthSession({
      sessionCreatedAt: sessionInsert.values.createdAt,
      userEmail: user.email,
      userId: user.id,
      userName: user.name,
    }),
  };
}

export async function signUpWithPassword(
  input: SignUpWithPasswordInput,
): Promise<AuthResult> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const [existingUser] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return emailAlreadyExistsResult();
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const userId = randomUUID();
  const sessionInsert = createSessionInsert(userId, now);

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email,
        name,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(sessions).values(sessionInsert.values);
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return emailAlreadyExistsResult();
    }

    throw error;
  }

  await setSessionCookie(sessionInsert.cookieToken, sessionInsert.expiresAt);

  return {
    ok: true,
    session: buildAuthSession({
      sessionCreatedAt: now,
      userEmail: email,
      userId,
      userName: name,
    }),
  };
}

export async function signOut() {
  const rawToken = await readSessionToken();

  if (rawToken) {
    const db = getDb();

    try {
      await db
        .delete(sessions)
        .where(eq(sessions.tokenHash, hashSessionToken(rawToken)));
    } catch {
      // Best effort: the browser must still be logged out even if the cleanup write fails.
    }
  }

  await clearSessionCookie();
}
