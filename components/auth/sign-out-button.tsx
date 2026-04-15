"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function SignOutButton() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNavigating, startNavigation] = useTransition()

  async function handleSignOut() {
    setIsSubmitting(true)

    try {
      const result = await authClient.signOut()

      if (result.error) {
        setIsSubmitting(false)
        return
      }

      startNavigation(() => {
        router.push("/auth")
        router.refresh()
      })
    } catch {
      setIsSubmitting(false)
    }
  }

  const isPending = isSubmitting || isNavigating

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isPending}>
      {isPending ? <Spinner data-icon="inline-start" /> : <LogOutIcon data-icon="inline-start" />}
      退出登录
    </Button>
  )
}
