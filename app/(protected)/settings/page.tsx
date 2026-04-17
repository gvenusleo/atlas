import { redirect } from "next/navigation"

import { SettingsPanel } from "@/components/settings/settings-panel"
import { getSession } from "@/lib/auth-session"

export default async function SettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth")
  }

  return (
    <SettingsPanel
      user={{
        email: session.user.email,
        id: session.user.id,
        image: session.user.image ?? null,
        name: session.user.name,
      }}
    />
  )
}
