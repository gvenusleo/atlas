import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("缺少 DATABASE_URL，无法执行 Drizzle 命令。")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/*.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
})
