import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db, sql } from "./client";

const run = async () => {
  await migrate(db, {
    migrationsFolder: "./migrations",
  });

  await sql.end();
};

run().catch(async (error) => {
  console.error("Failed to run migrations", error);
  await sql.end({ timeout: 0 });
  process.exit(1);
});
