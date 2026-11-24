<h1 align="center">Wager</h1>

<p align="center">
  <strong>Customer journey stitching with bitemporal event tracking.</strong>
</p>

<p align="center">
  A web portal, Android app and browser call simulator backed by a shared event store.<br>
  Supports late identity binding, versioned attribution and historical journey queries.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/API-FastAPI-009688?style=flat" alt="API: FastAPI">
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat" alt="Language: TypeScript">
  <img src="https://img.shields.io/badge/Web-React_%2B_Vite-149ECA?style=flat" alt="Web: React and Vite">
  <img src="https://img.shields.io/badge/Mobile-React_Native_%2B_Expo-555555?style=flat" alt="Mobile: React Native and Expo">
  <img src="https://img.shields.io/badge/Storage-SQLite-003B57?style=flat" alt="Storage: SQLite">
</p>

<p align="center">
  <a href="#overview">Overview</a> &middot;
  <a href="#channels">Channels</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#quickstart">Quickstart</a> &middot;
  <a href="#cross-channel-demo">Demo</a> &middot;
  <a href="#verification">Verification</a>
</p>

---

## Overview

Wager is a local prototype for customer support across web, mobile and simulated
phone calls. Customers can create inquiries, exchange messages and check status
through a shared backend. Each channel reads and updates the same case history.

The backend retains anonymous events until they can be linked to a customer.
It records identity attribution changes separately from the original events,
allowing queries to distinguish when an action happened from when the system
learned who it belonged to.

## Channels

| Channel | Implementation | Capabilities |
| --- | --- | --- |
| Web portal | React, TypeScript, Vite | Transactions, disputes, support inquiries, follow-up messages, demo sign-in and a technical event inspector. |
| Mobile app | React Native, Expo, Expo Router | Shared inquiries and messages, account views, QR/manual web-session linking and installable Android builds. |
| Support call | React, TypeScript, Vite | Independent demo verification, existing inquiry retrieval, spoken status, follow-up requests, keypad controls and a written transcript. |

All three channels support light and dark appearances. The call channel is a
browser IVR simulation with optional text-to-speech. It does not dial a phone
number, use a microphone or schedule callbacks.

## Architecture

The three frontends connect to one FastAPI service through shared TypeScript
contracts and transport. The backend builds customer cases and journey views
from a durable event log and its attribution history.

### Event history and identity

The API validates Canonical Customer Journey Event Protocol
(CJEP) envelopes with Pydantic and persists events, attribution versions,
retractions, sessions, handoffs and calls in SQLite. Events retain valid time
(when an action happened) and ingest time (when it reached the backend).
The backend assigns receipt time, deduplicates repeated event IDs and rejects
conflicting payloads. Attribution changes are recorded separately rather than
rewriting raw events, with retraction records describing the old and new state.
Historical journey queries and knowledge-gap calculations compare current history
with what was known at an earlier contact time.

Anonymous events remain in an orphan buffer. Demo sign-in can bind events from
that session; a different anonymous web session requires an explicit, expiring,
single-use handoff. Mobile sign-in and call verification retrieve already
attributed customer inquiries without requiring another web-session handoff.
Identity is not inferred from a caller's phone number or an unrelated device.

### Client transport and recovery

The shared client provides bearer-session handling, backend-specific storage and
durable offline event retries. Browser storage adapters and native AsyncStorage/
SecureStore adapters support each platform. The API validates event ownership and
scopes case access. SQLite transactions persist related state changes together.
Server-sent events notify clients of updates so they can refetch authorized views.

Call events are server-authored, with persistent lifecycle state and idempotent
action IDs. The call interface restores confirmed history, retries pending call
end requests and provides recovery when a session expires. Pending actions remain
labelled as unconfirmed until the backend acknowledges them.

### Diagnostics and interface

The web inspector exposes event filtering, raw CJEP envelopes, attribution
versions, retractions, copy and JSON export for the synthetic demo dataset.
Customer-facing views share inquiry messages and timelines across channels.
The interfaces share typography and color conventions, with light/dark themes,
visible focus states and reduced-motion handling. Call prompts always have a text alternative.

## Repository

```text
apps/web/           Customer portal and event inspector
apps/mobile/        Native mobile channel
apps/call/          Browser call simulator
services/api/       Shared API, event protocol and SQLite store
packages/contracts/ Shared TypeScript models
packages/client/    Shared transport and storage interfaces
tests/              Backend, cross-channel, client and theme checks
```

## Quickstart

The documented setup uses Python 3.13 and Node.js 24.3+ in the 24.x series.
Commands below use PowerShell. No cloud services are required.

From the project root, create a virtual environment, install dependencies and
start the backend:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000
```

Install browser dependencies once:

```powershell
npm.cmd --prefix apps/web ci
npm.cmd --prefix apps/call ci
```

Run each browser channel in its own terminal from the project root:

```powershell
npm.cmd run web
```

```powershell
npm.cmd run call
```

Open the [web portal](http://localhost:5173),
[call simulator](http://localhost:5174) or [API docs](http://localhost:8000/docs). Data persists in
`.data/wager.sqlite3`; `WAGER_DB_PATH` can select another database file.

The [mobile setup guide](MOBILE_SETUP.md) covers Android tools, phone installation,
networking and release APKs. Development builds require Metro; release APKs do
not. Both require the backend. See the [call guide](apps/call/README.md) for
simulator controls and recovery.

## Cross-channel demo

1. Create a dispute on the web while signed out, then sign in as Alex Mercer
   (`C1041`). Inspect the retained events and attribution changes in the portal.
2. Sign in as Alex on mobile and open the same inquiry. For an anonymous web
   session on another device, use the existing QR or manual linking flow.
3. Start a support call using customer number `1041` and demo PIN `1234`.
   Select the inquiry, hear its status, request a follow-up and end the call.
4. Refresh the inquiry on web and mobile to see the follow-up and call activity
   in the same history.

## Verification

After installing the dependencies above, run from the project root:

```powershell
.\.venv\Scripts\python.exe -m unittest discover tests
node --test tests/client.test.mjs tests/call-client.test.mjs tests/web-theme.test.mjs
npm.cmd run check:web
npm.cmd run check:call
npm.cmd --prefix apps/call run lint
```

After installing mobile dependencies, run `npm.cmd run check:mobile`.
Tests cover attribution history, handoff isolation, persistence, call authorization,
client retries and web theme behavior/contrast.

This is a demonstration system with synthetic customer data and public demo
credentials. Production authentication, real telephony, probabilistic identity
matching and automated inquiry resolution are outside the implemented scope.
