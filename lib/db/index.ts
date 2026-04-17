import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "@/lib/db/schema"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("缺少 DATABASE_URL，无法连接 PostgreSQL。")
}

declare global {
  var __atlasPool: Pool | undefined
}

const pool =
  globalThis.__atlasPool ??
  new Pool({
    connectionString: databaseUrl,
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.__atlasPool = pool
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema })
export { pool }
