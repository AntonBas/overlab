import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const ASSETS_DIRECTORY = "dist/assets";
const ENTRY_BUDGET_KB = 125;
const CHUNK_BUDGET_KB = 30;
const CHUNK_BUDGETS_KB = { vendor: 80, shared: 50 };

const failures = [];

if (!existsSync(ASSETS_DIRECTORY)) {
  console.error(
    `${ASSETS_DIRECTORY} does not exist, run "npm run build" first`,
  );
  process.exit(1);
}

for (const file of readdirSync(ASSETS_DIRECTORY)) {
  if (!file.endsWith(".js")) {
    continue;
  }
  const gzippedKb =
    gzipSync(readFileSync(join(ASSETS_DIRECTORY, file))).length / 1024;
  const chunkName = file.slice(0, file.lastIndexOf("-"));
  const budget = file.startsWith("index-")
    ? ENTRY_BUDGET_KB
    : (CHUNK_BUDGETS_KB[chunkName] ?? CHUNK_BUDGET_KB);
  const status = gzippedKb > budget ? "OVER" : "ok";
  console.log(
    `${status.padEnd(4)} ${file} ${gzippedKb.toFixed(1)} KB gzip (budget ${budget} KB)`,
  );
  if (gzippedKb > budget) {
    failures.push(file);
  }
}

if (failures.length > 0) {
  console.error(`Bundle budget exceeded: ${failures.join(", ")}`);
  process.exit(1);
}
