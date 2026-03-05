# Android + Play Store release guide

This project is now configured with Capacitor Android.

## 1) Sync web assets into Android project

- `npm run android:sync`
- This command builds from `src/main.*` when source exists, or reuses current `dist/` when source is not present.

## 2) Create a signing keystore (one-time)

- `mkdir -p keystore`
- `keytool -genkey -v -keystore keystore/kinospolu-release.jks -alias kinospolu -keyalg RSA -keysize 2048 -validity 10000`

## 3) Configure signing properties

1. Copy `android/keystore.properties.example` to `android/keystore.properties`
2. Fill in the real passwords and alias values.

## 4) Build release artifacts

- Signed release APK:
  - `npm run android:apk:release`
  - Output path: `android/app/build/outputs/apk/release/app-release.apk`
- Signed release AAB (required by Play Store):
  - `npm run android:aab:release`
  - Output path: `android/app/build/outputs/bundle/release/app-release.aab`

## 5) Upload to Play Console

Use the `app-release.aab` file in Google Play Console for production/internal testing tracks.

## 6) Publish app updates (important)

For every Play Store update:

1. Keep the same `appId` (`com.kinospolu.app`) and same keystore.
2. Increase Android app version:
   - Show current: `npm run android:version:show`
   - Auto bump patch + code: `npm run android:version:bump`
   - Or set manually: `npm run android:version:set -- --code=12 --name=1.3.0`
3. Build the new AAB:
   - `npm run android:aab:release`
4. Upload the new `app-release.aab` to Play Console.

Quick one-command flow:

- `npm run android:release:next`

Version values are stored in `android/gradle.properties` (`APP_VERSION_CODE`, `APP_VERSION_NAME`).

## 7) Optional: update web content without app store release

If you host your web app online and want the Android app to load it directly:

- Build with `CAPACITOR_SERVER_URL` set (example):
  - `CAPACITOR_SERVER_URL=https://your-domain.com npm run android:aab:release`

In this mode, future web changes on your hosted URL are reflected in the app without rebuilding native binaries.

## 8) Compliance gate before release

Run this before every store build:

- `npm run compliance:check`

Also review `LEGAL_PLAYSTORE_CHECKLIST.md` before uploading to production.
