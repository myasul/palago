import { defineConfig } from "drizzle-kit";
import { loadRepoEnv } from "./load-env";

loadRepoEnv(import.meta.url);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./schema.ts",
  out: "./migrations",
  dbCredentials: { url: databaseUrl },
});
