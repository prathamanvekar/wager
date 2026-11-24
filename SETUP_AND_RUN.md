# Local setup

Run commands in PowerShell from the project root unless another folder is shown.
The documented setup uses Python 3.13 and Node.js 24.3+ in the 24.x series.
No cloud account, API key or separate database service is needed.

## Backend

Create the virtual environment once, then install the Python dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Start one backend process and keep its terminal open:

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000
```

Check [API health](http://127.0.0.1:8000/api/v1/health) or open the
[API documentation](http://127.0.0.1:8000/docs). Saved history is in
`.data/wager.sqlite3`; restarting the API preserves it. Restart after backend
code changes to load the updated routes. Do not start a second API on port 8000.

## Web portal and call simulator

Install dependencies once, or after their lockfiles change:

```powershell
npm.cmd --prefix apps/web ci
npm.cmd --prefix apps/call ci
```

In separate terminals, from the project root:

```powershell
npm.cmd run web
```

```powershell
npm.cmd run call
```

Open the [portal](http://localhost:5173) and
[call simulator](http://localhost:5174). Both default to the API at
`http://127.0.0.1:8000/api/v1`. If Vite reports another portal port, use the URL
it prints. The call app requires port 5174 to be free.

To use another API, set `VITE_API_URL` in the relevant app's `.env` before starting
Vite. The call app also has a backend setting available between calls.

## Android app

Follow [MOBILE_SETUP.md](MOBILE_SETUP.md) for JDK 21, Android Studio, SDK tools,
USB installation and release APKs. The phone must reach the same backend using
the PC's Wi-Fi IP, for example `http://192.168.1.10:8000/api/v1`.
`localhost` on the phone refers to the phone itself.

For an already configured development device:

```powershell
cd apps/mobile
npm.cmd ci
npm.cmd run android
```

On later development sessions, run `npm.cmd start` in `apps/mobile` and open the
installed development app. Metro serves its JavaScript; the API serves customer
data. A release APK needs the API but does not need Metro or a USB connection.

## Demonstration and checks

[HOW_TO_USE.md](HOW_TO_USE.md) covers the three-channel demonstration.
[The call guide](apps/call/README.md) explains its keypad, verification and recovery.
All channels use demo identities and synthetic data.

From the project root, after installing each app's dependencies:

```powershell
.\.venv\Scripts\python.exe -m unittest discover tests
node --test tests/client.test.mjs tests/call-client.test.mjs tests/web-theme.test.mjs
npm.cmd run check:web
npm.cmd run check:mobile
npm.cmd run check:call
```
