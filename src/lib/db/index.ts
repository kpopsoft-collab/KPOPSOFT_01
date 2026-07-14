import "server-only";

import {
  neon,
  type NeonQueryFunction,
} from "@neondatabase/serverless";
import {
  drizzle,
  type NeonHttpDatabase,
} from "drizzle-orm/neon-http";

import * as schema from "./schema";
import { requireDatabaseUrl, type DatabaseEnv } from "./runtime";

type Database = NeonHttpDatabase<typeof schema>;

let cachedDb: Database | null = null;
let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getDb(env: DatabaseEnv = process.env): Database {
  const databaseUrl = requireDatabaseUrl(env);

  if (!cachedDb) {
    cachedSql = neon(databaseUrl);
    cachedDb = drizzle(cachedSql, { schema });
  }

  return cachedDb;
}
