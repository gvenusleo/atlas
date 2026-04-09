import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/service";
import { parseAuthMode } from "@/lib/auth/types";
import AuthShell from "./_components/auth-shell";

type AuthPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "登录与注册",
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  const { mode } = await searchParams;
  const initialMode = parseAuthMode(mode);

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-muted/30 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <AuthShell initialMode={initialMode} />
      </div>
    </main>
  );
}
