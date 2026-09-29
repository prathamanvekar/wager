# Wager

Most customer service stacks have selective amnesia. You dispute a mystery charge while logged out, log in twenty minutes later, call support two days later, and end up explaining the exact same story three times.

The usual excuse is that systems do not talk to each other. The real reason is subtler: traditional databases only store what they believe right now. If identity arrives late or a call transcript syncs six hours after the call ends, the old belief state is silently paved over.

Wager fixes this by giving every event two independent clocks: when it actually happened, and when the system learned about it. Logged-out actions wait in an orphan buffer instead of the trash bin, late logins stitch past history with an explicit changelog, and you can query the system as of any moment in the past to see what an agent actually saw.

## Getting Started

Everything runs locally on your machine with zero cloud setup.

### 1. Backend API (FastAPI)

```bash
python -m uvicorn services.api.main:app --host 127.0.0.1 --port 8000 --reload
```

The API spins up at `http://127.0.0.1:8000`. You can inspect the OpenAPI docs at `http://127.0.0.1:8000/docs`.

### 2. Web Portal (React + Vite)

In a separate terminal window:

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:5173` to see the portal in action.

### 3. Verification Suite

Run the bitemporal test suite to verify orphan retention, late binding, and knowledge gap calculations:

```bash
python -m unittest discover tests
```

## How To Try The Magic

1. Open the portal while logged out.
2. File a dispute on the CloudScale SaaS charge. It gets buffered as an orphan event rather than thrown away.
3. Click sign in as Alex Mercer (C1041). The engine recognizes the device fingerprint, claims the orphan retroactively, and emits a retraction pair.
4. Jump into the CJEP Event Stream tab to watch the raw envelopes, dual clocks, and state changes unfold live.
