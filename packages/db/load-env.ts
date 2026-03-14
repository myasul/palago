import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const findUp = (startDir: string, fileName: string) => {
  let currentDir = startDir;

  while (true) {
    const candidate = path.join(currentDir, fileName);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
};

export const resolvePackageRoot = (metaUrl: string) => {
  const currentDir = path.dirname(fileURLToPath(metaUrl));

  console.log("[resolvePackageRoot] Current dir:", currentDir);

  const packageJsonPath = findUp(currentDir, "package.json");

  if (!packageJsonPath) {
    throw new Error("Unable to resolve package root");
  }

  return path.dirname(packageJsonPath);
};

export const loadRepoEnv = (metaUrl: string) => {
  console.log("[loadRepoEnv] Loading repo env from", metaUrl);

  if (process.env.DATABASE_URL) {
    return;
  }

  const packageRoot = resolvePackageRoot(metaUrl);
  const envPath = findUp(packageRoot, ".env");

  if (envPath) {
    dotenv.config({ path: envPath, quiet: true });
  }
};
