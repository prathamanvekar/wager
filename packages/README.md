# Shared channel code

`contracts/src` contains platform-independent CJEP, customer, case, transaction,
session and call models. The JSON wire schema in
`contracts/schemas/event-envelope.schema.json` is exported from Pydantic.
`contracts/fixtures/transactions.json` contains the sample transaction data.

`client/src` implements HTTP transport, bearer sessions, event creation and a
durable event retry queue. Dedicated call methods send idempotent actions and
return server-confirmed state; call actions do not enter the generic event queue.

Web, mobile and call apps import these sources directly. Each app installs its
own dependencies because their React/runtime versions differ. Shared packages
import no React runtime. Vite filesystem allowances and Metro's watch folders
include the shared source.

Storage is injected. Browser apps use localStorage/sessionStorage adapters;
mobile uses AsyncStorage for pending events and SecureStore for credentials.
Backend-specific storage keeps credentials and retries separate between APIs.
Keep DOM, navigation, device APIs and identity-resolution logic outside the client.

After backend envelope changes, run this from the project root and update the
TypeScript contract alongside the exported schema:

```powershell
.\.venv\Scripts\python.exe scripts/export_protocol.py
```

Backend integration tests exercise validators, attribution rules and case
projections. Client tests cover persistent event retries, session isolation and
call transport. See the [root README](../README.md#verification) for commands.
