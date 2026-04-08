import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to use the Atlas auth backend.");
  }

  return databaseUrl;
}

const globalForDb = globalThis as typeof globalThis & {
  atlasSql?: Sql;
};

function createSqlClient() {
  return postgres(getDatabaseUrl(), {
    prepare: false,
  });
}

function createDb(sql: Sql) {
  return drizzle(sql, { schema });
}

type Database = ReturnType<typeof createDb>;

let dbInstance: Database | undefined;

function getSqlClient() {
  if (globalForDb.atlasSql) {
    return globalForDb.atlasSql;
  }

  const sql = createSqlClient();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.atlasSql = sql;
  }

  return sql;
}

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = createDb(getSqlClient());
  return dbInstance;
}
