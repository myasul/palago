import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { loadRepoEnv } from "./load-env";
import * as schema from "./schema";

console.log("[client.ts] Loading repo env from", import.meta.url);

loadRepoEnv(import.meta.url);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = postgres(databaseUrl, { prepare: false });

export const db = drizzle(sql, { schema });
