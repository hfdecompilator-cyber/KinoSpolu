import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const hasSourceEntry =
  existsSync("src/main.tsx") ||
  existsSync("src/main.jsx") ||
  existsSync("src/main.ts") ||
  existsSync("src/main.js");

if (hasSourceEntry) {
  console.log("Source entry found. Building fresh web assets...");
  run("npm", ["run", "build"]);
} else if (existsSync("dist/index.html")) {
  console.warn(
    "No src/main.* entry found. Reusing existing dist/ assets for Android packaging."
  );
} else {
  console.error("Missing both src/main.* entry and dist/index.html. Cannot sync Android.");
  process.exit(1);
}

run("npx", ["cap", "sync", "android"]);
