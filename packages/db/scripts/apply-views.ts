import { readFile } from "node:fs/promises";
import postgres from "postgres";

import { loadRepoEnv } from "../load-env";

loadRepoEnv(import.meta.url);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(databaseUrl, { max: 1 });

const run = async () => {
  const filePath = new URL("./sql/create_52_week_view.sql", import.meta.url);
  const viewSql = await readFile(filePath, "utf8");

  await sql.unsafe(viewSql);
  await sql.end();
};

run().catch(async (error) => {
  console.error("Failed to apply SQL views", error);
  await sql.end({ timeout: 0 });
  process.exit(1);
});
