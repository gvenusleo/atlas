import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "@/lib/db/schema"
import { getServerEnv } from "@/lib/env/server"

declare global {
  var __atlasPool: Pool | undefined
}

const serverEnv = getServerEnv()

const pool =
  globalThis.__atlasPool ??
  new Pool({
    connectionString: serverEnv.databaseUrl,
  })

if (!serverEnv.isProduction) {
  globalThis.__atlasPool = pool
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema })
export { pool }
