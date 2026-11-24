# Wager mobile

React Native with Expo SDK 58 and Expo Router. The Android app provides shared
inquiries and messages, support forms, account views, QR/manual web-session
linking and light/dark themes through the existing FastAPI backend.

Follow [the phone setup and APK guide](../../MOBILE_SETUP.md) for Android tools,
networking, development builds and release APKs. From the project root, once
those tools are configured:

```powershell
cd apps/mobile
npm.cmd ci
npm.cmd run android
```

This installs a development build on a USB-debugging Android device. For later
development sessions, run `npm.cmd start` here and open the installed app.
Metro serves development JavaScript; it is separate from the backend URL entered
on the connection screen. Release APKs do not require Metro or USB after installation.
Both builds need network access to the shared API for sign-in and synchronization.

`npm.cmd run web` provides a browser preview for UI/integration checks; it does
not replace native device checks. Run `npm.cmd run typecheck` and
`npm.cmd run lint` from this folder for source checks.

Local builds need no Expo account or cloud subscription. EAS cloud builds are
optional and require an Expo account. The preview profile outputs an APK;
production signing and a hosted HTTPS API are separate deployment work.

See [the demo walkthrough](../../HOW_TO_USE.md) for the three-channel flow.
