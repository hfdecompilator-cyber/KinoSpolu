# Building the PopcornLobby APK

The Android APK requires the Android SDK. Build it on your machine with Android Studio or the command-line tools.

## Prerequisites

1. **Android Studio** (recommended) or **Android command-line tools**
2. **Java 17** (JDK 17)

## Quick build (with Android Studio installed)

1. Install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio → SDK Manager → note your SDK path (e.g. `~/Android/Sdk`)
3. From the project root:

```bash
# Set SDK path (adjust to your install)
export ANDROID_HOME=$HOME/Android/Sdk

# Build debug APK
npm run android:apk:debug
```

4. APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

## Using local.properties

Create `android/local.properties`:

```properties
sdk.dir=/path/to/your/Android/Sdk
```

Then run:

```bash
npm run android:apk:debug
```

## Release APK (for Play Store)

1. Create a keystore (one-time):
   ```bash
   keytool -genkey -v -keystore popcorn-release.keystore -alias popcorn -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in your paths

3. Run:
   ```bash
   npm run android:apk:release
   ```

Output: `android/app/build/outputs/apk/release/app-release.apk`
