# Wager Mobile Setup Guide — Windows + Android

This guide starts with no Android tools installed and ends with Wager running on
**your own phone**, sharing conversations with the web portal.

Use **PowerShell** throughout. The **project root** is the `major project` folder
containing this guide. You will use three terminals: backend, mobile and web.
The local workflow does not require an Expo account or cloud build service.

## 1. Install the PC tools (once)

Skip a tool only if you already have the version listed.

| Tool | Install and configure |
| --- | --- |
| [Node.js](https://nodejs.org/en/download) | Choose **Node 24 LTS**, Windows Installer (`.msi`), for your PC architecture. Keep npm and **Add to PATH** enabled. Use 24.3 or later in the 24.x series. |
| [Python](https://www.python.org/downloads/windows/) | Install **Python 3.13**, Windows installer. Enable **Add python.exe to PATH** and keep pip selected. |
| [Temurin JDK 21](https://adoptium.net/temurin/releases/?version=21) | Choose **Windows → JDK → 21 → MSI** for your PC architecture. In Custom Setup, enable **Add to PATH** and **Set JAVA_HOME**. |
| [Android Studio](https://developer.android.com/studio) | Download and install the Windows version. Launch it, complete the **Standard** setup wizard, and let SDK downloads finish. An emulator is optional; this guide uses a real phone. |

Close and reopen PowerShell, then check:

```powershell
node --version
npm.cmd --version
python --version
java -version
javac -version
$env:JAVA_HOME
```

**Expected:** Node `v24.x`, Python `3.13.x`, Java/Javac `21`, and `JAVA_HOME`
pointing to the JDK folder. If an existing Java 22 appears first in Path, that
can change `java -version`; terminal Gradle builds still use `JAVA_HOME`.
`npm.cmd` avoids PowerShell script-policy errors.

## 2. Install and configure the Android SDK (once)

### Download the SDK components

1. On Android Studio's welcome screen, open **More Actions → SDK Manager**.
   If a project is open, use **Tools → SDK Manager**.
2. Copy the **Android SDK Location** shown at the top. Usually it is
   `C:\Users\YOUR_NAME\AppData\Local\Android\Sdk`.
3. In **SDK Platforms**, select **Android SDK Platform 37**. Enable **Show
   Package Details** if necessary. This is the compile SDK used by this project's
   installed Expo 58 / React Native 0.88 dependencies; your phone does not need
   to run Android API 37.
4. In **SDK Tools**, enable **Show Package Details** and select:
   - **Android SDK Build-Tools 37.0.0**
   - **Android SDK Platform-Tools** (includes `adb`)
   - **Android SDK Command-line Tools (latest)**
   - **NDK (Side by side) 27.1.12297006**
   - **CMake 4.1.2** (select this exact version)
5. Click **Apply**, review/accept the licenses, and wait for downloads to finish.

### Select CMake for Windows native builds

Installing a newer CMake does not automatically select it. Open
`C:\Users\YOUR_NAME\.gradle\gradle.properties` (create the folder/file if
missing), preserve existing settings, and add or update this line:

```properties
android.cmakeVersion=4.1.2
```

This local setting makes Expo use the installed version and its newer Ninja
build tool. Windows long paths must also be enabled. Check in PowerShell:

```powershell
Get-ItemPropertyValue 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' LongPathsEnabled
```

If the result is `1`, continue. If it is `0`, run the following in **PowerShell
as Administrator**, then restart the PC:

```powershell
Set-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' LongPathsEnabled 1
```


### Set Windows environment variables

Search Windows Start for **Edit environment variables for your account**.
Under **User variables**:

| Setting | Value |
| --- | --- |
| Create `ANDROID_HOME` | The actual **Android SDK Location** copied above |
| Check/create `JAVA_HOME` | Your installed JDK 21 folder, e.g. `C:\Program Files\Eclipse Adoptium\jdk-21…-hotspot`. Select the actual folder; do not include `bin`. |
| Edit `Path` → New | `%ANDROID_HOME%\platform-tools` |
| Edit `Path` → New | `%ANDROID_HOME%\cmdline-tools\latest\bin` |
| Edit `Path` → New, if missing | `%JAVA_HOME%\bin` |

Keep existing Path entries. Click **OK** to save, then close and reopen all
terminals. In a new PowerShell window:

```powershell
$env:ANDROID_HOME
Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe"
Test-Path "$env:JAVA_HOME\bin\javac.exe"
adb --version
& "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
```

**Expected:** both path checks return `True`, `adb` prints its version, and all
required SDK licenses are accepted. Review any outstanding license prompts.
Newer Android tools may report that `--licenses` is no longer needed; that
message is not a failure.
You do not need to create an Android Studio project or install Gradle separately.

## 3. Connect your phone by USB

Use an **Android 7.0 or newer** phone and a USB cable that supports data.

1. On the phone, open **Settings → About phone** and tap **Build number** seven
   times (sometimes under Software information). Enter your PIN if asked.
2. Open **Developer options** and enable **USB debugging**.
3. Connect by USB, unlock the phone, and accept **Allow USB debugging**.
   If asked for a USB mode, select **File transfer**.
4. On the PC, run:

```powershell
adb devices
```

**Expected:** your phone's serial number followed by `device`.
If it says `unauthorized`, unlock the phone and approve the prompt. If nothing
appears, try another data cable/USB port. Windows may need your manufacturer's
[official USB driver](https://developer.android.com/studio/run/oem-usb).
Keep USB connected for the first build.

## 4. Start the shared backend

Open **terminal 1** in the project root. For this checkout:

```powershell
cd "C:\Users\prath\Desktop\LOCKIN\dev\major project"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000
```

If your project is elsewhere, replace the first path. Reuse `.venv` if it already
exists. These commands use it directly, so activation is unnecessary.

**Check:** open [the API health page](http://127.0.0.1:8000/api/v1/health) on your
PC. Expect a JSON response. Leave this terminal running.

Next, open **terminal 2** and run `ipconfig`. Under your active Wi-Fi adapter,
find **IPv4 Address**. If it is `192.168.1.10`, your backend address is:

```text
http://192.168.1.10:8000/api/v1
```

Replace the example IP with your own. Put both devices on the same Wi-Fi, then
open `http://YOUR_PC_IP:8000/api/v1/health` in your **phone's browser**.
Do not continue until it returns JSON. If Windows Firewall asks, allow the API
on your trusted **private** network.

## 5. Build and run Wager on the phone

In **terminal 2**, from the project root:

```powershell
cd apps/mobile
npm.cmd ci
npm.cmd run android
```

Select your USB phone if prompted. Expo generates the native Android project,
Gradle builds it, and Wager installs on the phone. The first build downloads
additional dependencies and can take several minutes. Keep internet available.

If Wager opens its development launcher, connect to the Metro server shown in
the terminal. If no Metro server is running, run `npm.cmd start` in `apps/mobile`.
Allow Node.js on your private network if Windows Firewall prompts.

In Wager:

1. Enter `http://YOUR_PC_IP:8000/api/v1` from step 4.
2. Connect and select **Alex Mercer** as the demo persona.
3. Check that **Home, Conversations, Support and Account** open.

Keep the backend and Metro terminals running. The backend address is separate
from Metro's development-server address.

## 6. Verify that both channels work together

Open **terminal 3** in the project root:

```powershell
cd apps/web
npm.cmd ci
npm.cmd run dev
```

Open the portal URL printed in that terminal. Check these flows:

| Test | Action and expected result |
| --- | --- |
| Link a web conversation | Stay anonymous on web and file a **CloudScale dispute**. Choose **Continue on mobile**. In mobile, choose **Link web session**, scan the QR (allow camera access) or enter its 16-character code, check the account and confirm. The case appears in Conversations. A phone login alone should not claim the anonymous web case. |
| Reply across channels | Send a mobile reply and check it appears in the web conversation. Reply from web and check mobile receives it. |
| Start a separate inquiry | Start an inquiry from mobile. Sign in on web as the same persona and check it appears as its own conversation. |
| Recover from being offline | Open a case, then stop the backend with **Ctrl+C** in terminal 1. Save a mobile reply: it should show as pending. Restart the backend with the same uvicorn command from step 4. Return to mobile or pull to refresh: the reply should sync and appear on web once. |
| Keep history after restart | Reopen the apps after restarting the backend. Previously synced conversations should remain. |

Also check the phone's **Back button/gesture**, reply field with the keyboard
open, camera scanning, light/dark appearance and larger system font settings.
Handoff codes expire after five minutes and can only be used once.

## Next time: start these three terminals

Dependency installation and the USB build are one-time steps unless dependencies
or native configuration change. Open the installed Wager app after starting Metro.

| Folder | Command |
| --- | --- |
| Project root | `.\.venv\Scripts\python.exe -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000` |
| `apps/mobile` | `npm.cmd start` |
| `apps/web` | `npm.cmd run dev` |

Most UI edits refresh automatically. For native changes, rerun
`npm.cmd run android`. If your PC's Wi-Fi IP changes, update Wager's backend URL.

## Optional: build an APK that works without Metro

From `apps/mobile`:

```powershell
npx.cmd expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
adb install -r .\app\build\outputs\apk\release\app-release.apk
```

The APK is in `apps/mobile/android/app/build/outputs/apk/release/`. You can also
copy it to the phone and open it to install. Stop Metro and verify Wager still
opens; keep the backend running for sign-in and shared conversations.

This is a **local testing APK**. Check the generated `android/app/build.gradle`
signing settings before distribution; production needs your own release key.
Keep signing keys stable for updates. The production cloud profile requires HTTPS.

An optional cloud alternative, from `apps/mobile`, is
`npx.cmd eas-cli@latest login`, then `npx.cmd eas-cli@latest build:configure`, then
`npx.cmd eas-cli@latest build --platform android --profile preview`. Keep the
existing APK preview profile. This requires an Expo account and uploads source
to Expo; it is not needed for the local steps above.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| A command is not recognized | Reopen PowerShell after installation or environment edits. Check the relevant tool's Path entry. Use `npm.cmd`/`npx.cmd` if PowerShell blocks `.ps1` scripts. |
| SDK/Java build error | Recheck step 2, including `JAVA_HOME`, SDK Platform 37 and Build-Tools 37.0.0. If Gradle names another missing SDK/CMake package, install that version in SDK Manager and retry. |
| Phone not detected | Run `adb devices`; check USB authorization, cable and manufacturer USB driver (step 3). |
| API works on PC but not phone | Use the PC's Wi-Fi IP, not `localhost`, `127.0.0.1` or `0.0.0.0`. Check private-network firewall access and avoid guest Wi-Fi that isolates devices. An Expo tunnel does not tunnel the backend. |
| Development app cannot connect to Metro | Check `npm.cmd start` is running and Node.js has private-network firewall access. With USB connected, try `adb reverse tcp:8081 tcp:8081`, then open `http://127.0.0.1:8081` in the app's development launcher. |
| Ninja fails with `mkdir` / a path-length error | Check the CMake setting and Windows long-path support in step 2. The build log must say `Overriding CMake version: 4.1.2`. Old `.cxx` native caches need regeneration after switching tools; simply installing CMake is insufficient. A shorter checkout such as `C:\dev\wager` is another workaround. |
| Code expired or already used | Generate a new handoff code on web. |
| Sign-out/server change blocked | Reconnect and sync pending actions first. Do not clear app data to resolve pending actions or session-expiry errors. |
| Port 8000 is already in use | Reuse the backend already running, or stop it in its original terminal before starting another. |

**Data and scope:** history persists in `.data/wager.sqlite3`; do not delete it
to restart. No separate database service is needed; run one backend process.
This is a local demo with persona sign-in and synthetic data, not production
authentication. Keep it off the public internet.

**Verification status:** the arm64 Android debug APK now builds successfully
with CMake 4.1.2 (24 November 2026). Typecheck and lint pass. JavaScript
bundling and browser integration were checked earlier. Installation and native
phone behavior still need the device checks above.

Tool references: [Expo local builds](https://docs.expo.dev/guides/local-app-development/),
[Android Studio installation](https://developer.android.com/studio/install),
[Windows Java installer options](https://adoptium.net/installation/windows/).
SDK package versions above were checked against this checkout's installed
React Native version catalog and Expo Gradle plugin.
