# Wager

## Platform
adaptive

## Purpose and users
Wager is a customer portal and technical event inspector. The redesign balances both experiences, as confirmed by the user. The repository demonstrates cross-channel customer journey stitching with late identity binding and a bitemporal event store.

## Capabilities and constraints
Preserve every existing workflow: landing-page simulation and specification, transactions and filtering, dispute creation and follow-ups, support requests, persona authentication, session inspection, architecture specifications, event simulation, event filtering, envelope inspection, copy and JSON export, offline queuing, and backend health checks. Preserve all event emission, data, state, and API behavior.

## Brand commitments
Keep the Wager name. The user requests a minimal, professional, sleek, light interface with clean typography, thoughtful spacing, clear hierarchy, intuitive interactions, and consistent treatment across every page and component. Remove purposeless decoration and visual clutter. Preserve web functionality. The current authorized scope adds the native mobile channel and strengthens shared backend continuity.

## Evidence
Existing React/TypeScript app in apps/web, FastAPI service in services/api, and repository setup/protocol documentation are the factual sources. Demonstration transactions and personas remain unchanged.


## Mobile channel
The user approved React Native with Expo and TypeScript, Android-first, against
the existing FastAPI service. Native Android and web have separate UI and storage
adapters with shared contracts and transport. The mobile experience should make
cross-channel continuity understandable through actual cases and messages.

The local milestone uses durable SQLite instead of requiring a PostgreSQL service.
PostgreSQL remains a future storage adapter; probabilistic matching, automated
intent clustering, lineage recomputation and production authentication remain
outside the implemented mobile milestone. Mobile sign-in uses demo personas.

Cross-device anonymous attribution requires explicit expiring handoff consent;
a phone login alone cannot identify a separate anonymous laptop session.


## Call channel
The third channel is a separate desktop-first browser IVR simulator in apps/call.
It independently verifies a demo customer number and PIN, retrieves already
attributed inquiries, reads actual status and adds a follow-up to the same case.
It reuses the shared API, contracts, transport and durable bitemporal store.
Unrelated anonymous web sessions are never silently claimed. Existing web and
mobile UI and interaction behavior are preserved.

The minimal scope includes keypad controls, browser speech with a full text
alternative, scoped earlier conversation context, light/dark themes, durable
call lifecycle and explicit recovery feedback. It does not implement PSTN,
microphone input, speech recognition, an AI agent, scheduled callbacks or
production identity verification. The public demo PIN is only a simulator input.
