import { cookies } from "next/headers";
import { z } from "zod";
import type {
  AuthResult,
  AuthSession,
  SignInWithPasswordInput,
  SignUpWithPasswordInput,
} from "./types";

const sessionCookieName = "atlas_session";

const authSessionSchema = z.object({
  createdAt: z.string().datetime(),
  user: z.object({
    email: z.string().email(),
    id: z.string().min(1),
    name: z.string().min(1),
  }),
});

function parseSessionCookie(value: string): AuthSession | null {
  try {
    const parsed = JSON.parse(value);
    const result = authSessionSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function notConfiguredResult(): AuthResult {
  return {
    code: "AUTH_NOT_CONFIGURED",
    message: "认证服务尚未接入，当前版本仅完成页面、表单校验与服务端动作骨架。",
    ok: false,
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(sessionCookieName)?.value;

  if (!rawSession) {
    return null;
  }

  return parseSessionCookie(rawSession);
}

export async function signInWithPassword(
  _input: SignInWithPasswordInput,
): Promise<AuthResult> {
  return notConfiguredResult();
}

export async function signUpWithPassword(
  _input: SignUpWithPasswordInput,
): Promise<AuthResult> {
  return notConfiguredResult();
}
