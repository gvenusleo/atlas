import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { db } from "@/lib/db"
import * as authSchema from "@/lib/db/schema/auth"
import { getServerEnv } from "@/lib/env/server"

const serverEnv = getServerEnv()

export const auth = betterAuth({
  baseURL: serverEnv.betterAuthUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },
  secret: serverEnv.betterAuthSecret,
})

export type Auth = typeof auth
export type AuthOptions = typeof auth.options
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
