import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { getSession } from "@/lib/auth-session"

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  if (!session) {
    redirect("/auth")
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-end px-4 py-4 sm:px-6">
          <SignOutButton />
        </header>
        {children}
      </div>
    </div>
  )
}
