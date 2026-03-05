# HEARO legal + Play Store checklist

Use this checklist before every production release.

## Core legal requirements

- Publish and maintain these pages:
  - `public/legal/privacy.html`
  - `public/legal/terms.html`
  - `public/legal/copyright.html`
- Require users to confirm they have rights to shared content.
- Provide a clear abuse/copyright report path and process reports quickly.
- Keep records of moderation actions and takedowns.

## Play Store policy requirements (social + UGC apps)

- Configure Play Console Data safety form accurately.
- Use correct content rating and disclose user-generated content.
- Enforce anti-abuse controls:
  - in-app reporting
  - user blocking/muting
  - account enforcement for repeat violations
- Do not request high-risk Android permissions unless required by feature.

## Release checks

1. `npm run compliance:check`
2. `npm run build`
3. `npm run android:aab:release`
4. Upload signed AAB using the same app ID and keystore.

This checklist is implementation guidance, not legal advice.
