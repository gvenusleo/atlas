import { loadEnvConfig } from "@next/env"
import { defineConfig } from "drizzle-kit"
import { getServerEnv } from "./lib/env/server"

loadEnvConfig(process.cwd())

const serverEnv = getServerEnv()

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/*.ts",
  out: "./drizzle",
  dbCredentials: {
    url: serverEnv.databaseUrl,
  },
  verbose: true,
  strict: true,
})
