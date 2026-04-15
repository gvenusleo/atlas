"use client"

import { createAuthClient } from "better-auth/react"
import type { AuthOptions } from "@/auth"

export const authClient = createAuthClient<{ $InferAuth: AuthOptions }>()
