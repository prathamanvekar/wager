# Wager web portal

React, TypeScript and Vite frontend for transactions, disputes, support inquiries,
shared case messages and the CJEP event inspector. Includes light/dark themes.

From the project root:

```powershell
npm.cmd --prefix apps/web ci
npm.cmd run web
```

Open the URL printed by Vite, normally `http://localhost:5173`.
Start the shared API first using [the setup guide](../../SETUP_AND_RUN.md).
The default API is `http://127.0.0.1:8000/api/v1`; set `VITE_API_URL` in
`apps/web/.env` before starting Vite to override it.

The portal imports contracts and transport directly from `packages/`.
Customer case views are scoped to the active session/customer. The inspector
shows demo-wide synthetic event data and attribution history.

From the project root:

```powershell
npm.cmd run check:web
npm.cmd --prefix apps/web run lint
```

See [the demo walkthrough](../../HOW_TO_USE.md) for web, mobile and call continuity.
