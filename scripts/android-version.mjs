import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const gradlePath = resolve("android/gradle.properties");

const readProperties = () => {
  const content = readFileSync(gradlePath, "utf8");
  const lines = content.split("\n");
  const props = Object.fromEntries(
    lines
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        if (idx === -1) return [line.trim(), ""];
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      })
  );
  return { content, lines, props };
};

const semverRegex = /^\d+\.\d+\.\d+$/;
const args = process.argv.slice(2);

const showOnly = args.includes("--show");
const bumpPatch = args.includes("--bump-patch");
const codeArg = args.find((arg) => arg.startsWith("--code="));
const nameArg = args.find((arg) => arg.startsWith("--name="));

const { content, props } = readProperties();

let nextCode = Number.parseInt(props.APP_VERSION_CODE ?? "1", 10);
let nextName = props.APP_VERSION_NAME ?? "1.0.0";

if (Number.isNaN(nextCode) || nextCode < 1) {
  throw new Error("APP_VERSION_CODE in android/gradle.properties is invalid.");
}
if (!semverRegex.test(nextName)) {
  throw new Error(
    "APP_VERSION_NAME in android/gradle.properties must match MAJOR.MINOR.PATCH."
  );
}

if (showOnly) {
  console.log(`APP_VERSION_CODE=${nextCode}`);
  console.log(`APP_VERSION_NAME=${nextName}`);
  process.exit(0);
}

if (codeArg) {
  const parsed = Number.parseInt(codeArg.split("=")[1], 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error("--code must be a positive integer.");
  }
  nextCode = parsed;
}

if (nameArg) {
  const parsed = nameArg.split("=")[1];
  if (!semverRegex.test(parsed)) {
    throw new Error("--name must match MAJOR.MINOR.PATCH (example: 1.2.3).");
  }
  nextName = parsed;
}

if (bumpPatch) {
  const [major, minor, patch] = nextName.split(".").map((part) => Number.parseInt(part, 10));
  nextName = `${major}.${minor}.${patch + 1}`;
  nextCode += 1;
}

if (!codeArg && !nameArg && !bumpPatch) {
  throw new Error("Provide --show, --bump-patch, or explicit --code/--name arguments.");
}

if (nextCode < 1) {
  throw new Error("APP_VERSION_CODE must remain >= 1.");
}

const updated = content
  .replace(/^APP_VERSION_CODE=.*$/m, `APP_VERSION_CODE=${nextCode}`)
  .replace(/^APP_VERSION_NAME=.*$/m, `APP_VERSION_NAME=${nextName}`);

writeFileSync(gradlePath, updated, "utf8");

console.log(`Updated APP_VERSION_CODE=${nextCode}`);
console.log(`Updated APP_VERSION_NAME=${nextName}`);
