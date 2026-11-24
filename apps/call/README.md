# Wager support call simulator

A separate browser app for the third channel. It uses the same FastAPI service,
SQLite event store and customer inquiries as web and mobile. No Android build,
phone number, paid service or microphone permission is needed.

## 1. Start the shared backend

Use the running backend if it already has the call routes. After backend code
changes, stop it with Ctrl+C in its original terminal and restart. For a fresh
setup, first follow [the project setup guide](../../SETUP_AND_RUN.md).
From the project root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000
```

If you do not use the project virtual environment, use `python` instead of
`.\.venv\Scripts\python.exe`. Install missing dependencies with
`python -m pip install -r requirements.txt`.

Keep the existing database. Restarting loads the new call routes and preserves
saved inquiries. Web and mobile can keep using this same backend address.

## 2. Start the call app

In another terminal, from the project root:

```powershell
cd apps/call
npm.cmd ci
npm.cmd run dev
```

Open **http://localhost:5174**. Keep both terminals running. Subsequent starts
only need `npm.cmd run dev`; reinstall dependencies when the lockfile changes.

The default backend is `http://127.0.0.1:8000/api/v1`. The settings icon lets you
change it between calls. An optional `.env` can set `VITE_API_URL` before starting
Vite. If port 5174 is occupied, close the earlier call-app terminal first.

## 3. Make a demo call

1. Click **Start support call**.
2. Enter a customer number, then Continue or **#**:

   | Customer | Number | Demo PIN |
   | --- | --- | --- |
   | Alex Mercer | 1041 | 1234 |
   | Priya | 2094 | 1234 |
   | David | 3819 | 1234 |

3. Enter **1234**, then Verify demo identity or **#**. Three incorrect attempts
   end this call; start another to try again.
4. Choose an existing inquiry. Its earlier messages appear beside the call.
5. Press **1** to hear its actual status, **2** to request a follow-up, or **0**
   to choose another inquiry. You can also click the labelled actions.
6. Click **End call** to save the call summary. You can then start another call.

**Audio on/off** controls browser speech. **Replay** repeats the current prompt.
Every prompt is also written in the transcript, so speech support is optional.
This is a keypad-driven IVR simulation, not a real telephone or voice conversation.
The demo PIN is intentionally public and is not production authentication.

## 4. Verify continuity across channels

1. On web or mobile, sign in as Alex and open or create an inquiry.
2. Verify as **1041 / 1234** in the call app. Select that same inquiry.
3. Hear its status, request a follow-up and end the call.
4. Refresh the inquiry on web and mobile. The follow-up message and call timeline
   entries should be present, without creating a second inquiry.
5. Start another call as **2094 / 1234**. Alex's inquiries should not appear.

Already attributed customer inquiries require no web-session handoff. An unrelated
anonymous web session still needs the existing explicit login/linking flow before
its activity belongs to that customer. The call does not guess identity from a
phone number or claim unrelated sessions.

A follow-up adds a request to the existing conversation. It does not schedule a
callback or change the inquiry's resolution status.

## Connection and recovery

| Situation | Action |
| --- | --- |
| Call endpoints unavailable | Restart the backend from the updated project. |
| No inquiries | Use the same backend and persona across channels. Create an inquiry or explicitly link the original anonymous session, then refresh. |
| Backend interrupted | Retry after restarting it. Ending stops the call locally; its summary retries while this tab is open or restored in the same browser session. Actions require backend acknowledgement before they are shown as saved. |
| Session unavailable | Choose Start new session. Confirmed history remains saved, but unconfirmed actions or the final summary may not be saved. |
| Reload | The same tab restores confirmed call state. Closing the browser session can discard its access credentials; backend history remains. Avoid duplicating an active call tab. |

## Developer checks

From the project root:

```powershell
.\.venv\Scripts\python.exe -m unittest discover tests
node --test tests/client.test.mjs tests/call-client.test.mjs tests/web-theme.test.mjs
npm.cmd --prefix apps/call run build
npm.cmd --prefix apps/call run lint
```

Call routes are under `/api/v1/calls`. They require a call-session bearer token;
verification and call events are server-owned. State and idempotent action IDs
persist in the existing SQLite store. The app reuses `packages/client` and
`packages/contracts` rather than duplicating the backend or customer data.
