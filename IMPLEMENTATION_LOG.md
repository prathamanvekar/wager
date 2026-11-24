# Wager Web Experience — Implementation Log

## Overview
This log tracks the step-by-step implementation of the customer web channel for **Wager: Cross-Channel Journey Stitching with Late-Binding Identity and a Bitemporal Journey Store**.

The website serves as the primary live channel generating real interactions before and after customer authentication. It produces canonical events conforming to the CJEP v1 envelope and exposes the essential conditions for late identity binding, out-of-order event flows, and cross-channel continuity.

---

## The Four Ordered Tasks

### Task 1: Project Foundation, Architecture, Design System, and Main UI Shell
- **Status:** COMPLETED
- **Objectives:**
  - Initialize the frontend project workspace (`apps/web`) using React, TypeScript, and Vite.
  - Implement a design system tailored for a modern banking & support portal (custom tokens, typography, rich glassmorphism, responsive shell, semantic state badges).
  - Build the main UI shell with persistent navigation, responsive layout, and an interactive Channel/Session context bar that displays active identifiers (`device_id`, `session_id`, `ip_hash`) and authentication status (`anonymous` vs. `authenticated`).
  - Establish state management for user sessions and visitor context.
- **Verification:**
  - TypeScript compilation and production build verified (`tsc -b && vite build` succeeded with 0 errors).
  - Dev server verified running on `http://localhost:5173/`.

### Task 2: Customer-Facing Website Flows and the Actual Support/Journey Interaction Experience
- **Status:** COMPLETED
- **Objectives:**
  - Implement the core banking/support portal views and user interaction flows:
    - **Dispute Filing Wizard (`DisputeWizard.tsx`)**: 3-step interactive flow (transaction review, dispute reason selection, customer notes & evidence upload) with clear callouts showing how logged-out events are tagged as `orphan` with weak device tokens.
    - **Case Detail & Multi-Channel Timeline (`CaseDetailModal.tsx`)**: Displays identity provenance, chronological multi-channel event timeline, and interactive customer message composer that appends follow-up notes and emits `support.case.message_sent` events.
    - **Retroactive Late Binding Demonstration (`App.tsx`)**: Automatically watches for authentication events. When a user authenticates as `C1041 - Alex Mercer`, any case opened during an anonymous session is claimed from the pending buffer, updating its state to resolved and logging a retroactive binding event into its timeline.
    - **Multi-Intent Support Inquiry Workflow (`SupportInquiryModal.tsx`)**: Dedicated flow for independent requests (credit-limit increase to $25k, card replacement) that creates distinct threads (`credit_inquiry`), proving the system avoids false repeat-contact alerts.
- **Verification:**
  - Production build verified with `tsc -b && vite build` (built in ~400ms with 0 errors).
  - Dev server active and serving interactive portal on `http://localhost:5173/`.

### Task 3: Backend/API/Event Integration so Website Actions Become Proper Cross-Channel Events
- **Status:** COMPLETED
- **Objectives:**
  - Build the core FastAPI backend service (`services/api`) implementing the canonical CJEP v1 event protocol, bitemporal store, pending orphan buffer, and Server-Sent Events stream.
  - Create the client-side API integration layer (`apps/web/src/services/api.ts`) supporting live event transmission, offline queueing with auto-recovery, and real-time SSE subscription.
  - Integrate live backend telemetry and connection indicators into the UI shell and Inspector page.
  - Formally verify bitemporal AS-OF reconstruction and Knowledge Gap computation across the Mon 10:00 logged-out dispute and Mon 10:47 login sequence.
- **Verification:**
  - Backend running live on `http://127.0.0.1:8000`.
  - Frontend production build verified (`tsc -b && vite build` passed with 0 errors).
  - End-to-end integration test executed:
    * Mon 10:00 dispute event ingested as `buffered_orphan` (`orphan`).
    * Mon 10:30 AS-OF query verified: 0 events known for `C1041`.
    * Mon 10:47 login ingested for `C1041`: binding triggered, 1 orphan claimed, 1 retraction pair emitted.
    * Current journey query: 2 stitched events.
    * Mon 10:30 AS-OF reconstruction: exactly 0 events (proves the historical record is preserved rather than overwritten).
    * Mon 10:30 Knowledge Gap: exactly 2 invisible events identified.

### Task 4: Final UI Polish, States, Error Handling, Testing, and Integration Cleanup
- **Status:** COMPLETED
- **Objectives:**
  - Polish visual craft, responsive adaptations, micro-animations, and transition states across desktop and mobile viewports.
  - Harden form validation, empty states, error boundaries, and network retry mechanisms.
  - Execute automated tests across the full anonymous-to-authenticated customer journey.
  - Final cleanup, architectural documentation, and verification records.
- **Completed Deliverables:**
  - `apps/web/src/components/ErrorBoundary.tsx`: Robust React error boundary with fallback UI and session state preservation.
  - `apps/web/src/context/ToastContext.tsx`: Non-intrusive floating toast notifications for user interactions, identity binding milestones, and offline queue flush events.
  - `apps/web/src/design-system/tokens.css`: Enhanced with micro-animations (`slideUp`, `scaleIn`, `spin`, `pulseGlow`) and responsive design adjustments.
  - `tests/test_backend_api.py`: Automated test suite verifying CJEP v1 protocol validation, orphan buffer retention, late identity binding, bitemporal AS-OF timeline reconstruction, and knowledge gap metrics.
  - `README.md`: System architecture, quick start commands, and step-by-step flagship demonstration guide.
- **Verification:**
  - Automated tests executed via `python -m unittest discover tests` $\rightarrow$ 3/3 passed (`OK`).
  - Production bundle built via `tsc -b && vite build` $\rightarrow$ 0 errors, 327 kB gzip-optimized bundle.
  - Both frontend (`http://localhost:5173`) and backend API (`http://127.0.0.1:8000`) verified healthy and responding.

---

## Active Services & Local Runtime
- **Frontend Portal**: `http://localhost:5173/` (Vite + React)
- **FastAPI Backend**: `http://127.0.0.1:8000/` (Swagger docs at `/docs`, health at `/api/v1/health`)
- **External Services Used**: Zero paid or external services. 100% offline and laptop-friendly.
- **API Keys / Credentials Needed**: None.


## Mobile channel implementation — 24 November 2026

- Added `apps/mobile`, an Expo SDK 58 / React Native app with Expo Router,
  Home/Conversations/Support/Account, native case messages and timeline,
  QR/manual handoff, foreground sync, cached offline reads and durable writes.
- Extracted channel-independent types, fixture and transport into `packages/`.
- Replaced transient server state with a local SQLite-backed event/attribution
  store. Cases and transactions are shared projections; raw emission history is
  retained. Server timestamps, retry idempotency and conflicting-ID rejection
  protect ingestion. API session ownership guards case reads and writes.
- Persona sign-in now establishes identity on the server before emitting the
  login event. Binding is session-scoped; a shared device alone is insufficient.
- Explicit cross-device handoffs expire after five minutes, are stored as hashes,
  and are atomically consumed with attribution revisions and retractions.
- Web now hydrates shared cases/transactions and displays events from both
  channels; original event emission state is separate from current attribution.
- Phone setup, local builds, cloud APK profiles and limitations are documented in
  `MOBILE_SETUP.md`. No cloud upload/build has been initiated.
- Verification includes real API cross-channel tests, shared-client offline/retry
  tests, TypeScript/lint, Expo Doctor and Android JS bundle export. Native camera,
  installation, keyboard/insets and Back behavior need the user's Android phone
  or an SDK/emulator; a browser preview is not native-device evidence.
- Final checks: 13 backend tests and 9 shared-client tests pass; mobile typecheck,
  lint and Android Hermes bundle export pass; Expo Doctor passes 20/20 checks.
  Browser integration verified explicit web-to-mobile handoff and replies in both
  channels, including an offline reply automatically flushed after API restart.
- Finish review corrections preserve durable writes on temporary HTTP failures
  and discard stale refresh results across server/account changes. Native device
  verification remains outstanding; no APK was built in this environment.

## Windows native build recovery — 24 November 2026

- Diagnosed Ninja mkdir failure: generated Worklets object paths exceeded 260
  characters while Gradle selected CMake 3.22.1 / older Ninja.
- Windows long paths were already enabled. Set the local user Gradle property
  `android.cmakeVersion=4.1.2`; regenerated native caches (old caches preserved
  with timestamped names). No native source or dependency version changes.
- Verified `app:assembleDebug` for arm64-v8a: BUILD SUCCESSFUL, producing the
  debug APK. Mobile typecheck and lint also pass. Phone installation/runtime
  checks remain separate. Updated the setup guide with explicit CMake selection.

## Web visual refinement and theme support — 24 November 2026

- Kept existing portal navigation, workflows, layout structure and shared API
  behavior. Refined visual roles, type hierarchy, spacing, corner geometry and
  component styling across landing, portal, dialogs and diagnostics.
- Added pre-paint theme resolution, persisted explicit choices, system default,
  cross-tab updates, native color-scheme and reduced-motion-aware color changes.
- Following user feedback, web dark surfaces use neutral charcoal/gray; green is
  reserved for accents and states. Replaced the initial dropdown with an
  accessible binary light/dark switch in landing and portal headers.
- Production web build passes; eight theme bootstrap/contrast tests pass. Lint
  completes with warnings. Earlier browser captures cover the first palette;
  final charcoal/toggle visual recapture was not performed after the user
  stopped Computer Use. No Android/mobile source, build files or processes were
  modified during this web task.


## Browser call channel - 24 November 2026

- Added apps/call as a separate React/Vite IVR simulator with keypad verification,
  real scoped inquiry context, status prompts, follow-up requests, transcript,
  call summary and light/dark themes. Browser speech is optional; text is complete.
- Added server-owned call routes and durable call records in the existing SQLite
  store. Call events use the same attribution and case projections as web/mobile.
  Generic client ingestion cannot forge call events or bypass call verification.
- Independent demo verification exposes already attributed customer inquiries;
  unrelated anonymous web activity still requires explicit linking. PINs are not
  persisted. Follow-ups are idempotent and do not schedule actual callbacks.
- Added retry acknowledgement, restore, pending End and expired-session recovery.
  The source finish review identified and corrected repeat-call ID reuse and a
  timer live-region issue. Existing web/mobile source hashes remain unchanged.
- Validation: 21 Python API tests and 20 JavaScript transport/theme tests pass;
  call production build and lint pass. A live shared-client/API flow on an isolated
  database passed verification, inquiry selection, status, idempotent follow-up,
  End and restore. One earlier desktop dark ready view was inspected. Full current
  rendered flow, responsive/light layouts and audible speech remain unverified
  after the user stopped computer use. No real telephone service is integrated.
