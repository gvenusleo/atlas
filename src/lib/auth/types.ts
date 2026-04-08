export const authModes = ["login", "register"] as const;

export type AuthMode = (typeof authModes)[number];

export type AuthFailureCode =
  | "AUTH_NOT_CONFIGURED"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "UNKNOWN";

export type AuthSession = {
  createdAt: string;
  user: {
    email: string;
    id: string;
    name: string;
  };
};

export type SignInWithPasswordInput = {
  email: string;
  password: string;
};

export type SignUpWithPasswordInput = {
  email: string;
  name: string;
  password: string;
};

export type AuthResult =
  | {
      ok: true;
      session: AuthSession;
    }
  | {
      code: AuthFailureCode;
      message: string;
      ok: false;
    };

export function isAuthMode(value: string): value is AuthMode {
  return authModes.includes(value as AuthMode);
}

export function parseAuthMode(value: string | string[] | undefined): AuthMode {
  if (typeof value === "string" && isAuthMode(value)) {
    return value;
  }

  return "login";
}
