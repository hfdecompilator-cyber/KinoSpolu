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
