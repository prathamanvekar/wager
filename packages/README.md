# Shared channel code

- `contracts/src`: platform-independent CJEP, customer, case and transaction types.
- `contracts/schemas/event-envelope.schema.json`: Pydantic-exported wire schema.
- `contracts/fixtures/transactions.json`: the existing sample transactions.
- `client/src`: shared HTTP requests, envelope creation and durable retry queue.

Both apps import these source files directly. Each app keeps its own npm install
because Expo's React/React Native versions differ from the Vite app's React
version. Shared packages import no React runtime. Vite's filesystem allowance
and Metro's watch folder explicitly include shared source.

Storage is injected. Web uses browser storage/sessionStorage; Android uses
AsyncStorage for cache/pending actions and SecureStore for credentials.
Do not put DOM, navigation, device APIs or identity-resolution logic in this client.

Run `python scripts/export_protocol.py` after backend envelope changes, and update
the shared TypeScript contract alongside it. Cross-channel integration tests
exercise the actual FastAPI validators, attribution rules and case projections.
