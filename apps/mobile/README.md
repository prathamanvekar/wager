# Wager mobile

React Native / Expo SDK 58, with native Android UI, Expo Router navigation,
light and dark color schemes, shared event contracts and API transport.

See [the phone setup and APK guide](../../MOBILE_SETUP.md) for installation,
local networking, development builds, standalone APKs and the two-channel demo.

```powershell
npm install
npm run android
# Later development sessions
npm start
```

`npm run android` needs the Android SDK/JDK and a connected USB-debugging device.
`npm run web` is a browser convenience for UI/integration checking, not an
Android device simulator. Set the API address in the connection screen.

No cloud subscription is required for local builds. No Expo project ID or
cloud credentials are committed. The preview EAS profile outputs an APK;
production signing and a hosted HTTPS API are separate deployment work.
