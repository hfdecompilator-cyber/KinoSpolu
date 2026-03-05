import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const failures = [];

const mustExist = [
  "public/legal/privacy.html",
  "public/legal/terms.html",
  "public/legal/copyright.html",
  "src/App.tsx",
  "android/app/src/main/AndroidManifest.xml",
  "capacitor.config.ts"
];

for (const file of mustExist) {
  if (!existsSync(resolve(file))) {
    failures.push(`Missing required file: ${file}`);
  }
}

const checkContains = (file, snippet) => {
  const fullPath = resolve(file);
  if (!existsSync(fullPath)) return;
  const content = readFileSync(fullPath, "utf8");
  if (!content.includes(snippet)) {
    failures.push(`Missing required snippet in ${file}: "${snippet}"`);
  }
};

checkContains(
  "src/App.tsx",
  "I confirm I have rights or permission to share this content in the room."
);
checkContains("src/App.tsx", "Report abuse");
checkContains("src/App.tsx", "/legal/privacy.html");
checkContains("src/App.tsx", "/legal/terms.html");
checkContains("src/App.tsx", "/legal/copyright.html");

checkContains("capacitor.config.ts", "appId: 'com.kinospolu.app'");

if (existsSync(resolve("android/app/src/main/AndroidManifest.xml"))) {
  const manifest = readFileSync(resolve("android/app/src/main/AndroidManifest.xml"), "utf8");
  const disallowedPermissions = [
    "android.permission.QUERY_ALL_PACKAGES",
    "android.permission.READ_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.READ_CALL_LOG",
    "android.permission.WRITE_CALL_LOG"
  ];
  for (const perm of disallowedPermissions) {
    if (manifest.includes(perm)) {
      failures.push(`Disallowed permission present in AndroidManifest.xml: ${perm}`);
    }
  }
}

if (existsSync(resolve("package.json"))) {
  const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
  const scripts = pkg.scripts || {};
  const requiredScripts = [
    "build",
    "compliance:check",
    "android:apk:debug",
    "android:aab:release",
    "android:release:next"
  ];
  for (const key of requiredScripts) {
    if (!scripts[key]) {
      failures.push(`Missing npm script: ${key}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Compliance check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Compliance check passed.");
