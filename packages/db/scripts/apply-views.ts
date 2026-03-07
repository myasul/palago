import "dotenv/config";

import { readFile } from "node:fs/promises";

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, {
  max: 1,
});

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
