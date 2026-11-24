# Demo walkthrough

Start the shared backend and browser apps using [SETUP_AND_RUN.md](SETUP_AND_RUN.md).
Install or open the Android app using [MOBILE_SETUP.md](MOBILE_SETUP.md).
All channels must use the same backend. These steps use Alex Mercer (`C1041`).

## 1. Create an anonymous web inquiry

Open the portal at `http://localhost:5173` and enter the customer portal from the
landing page. While signed out, find the CloudScale SaaS transaction, choose
Dispute Charge, complete the form and submit the dispute.

The backend stores the event with an orphan attribution. It keeps the inquiry
available to its originating session without assigning it to a customer yet.

## 2. Bind identity in the same web session

Sign in as Alex Mercer in that browser session. Open Disputes & Cases and select
the inquiry to inspect its messages and identity-linking timeline entry.

Sign-in binds orphan events from that session to `C1041`. The original event
remains unchanged; the backend closes the prior attribution, records the resolved
version and emits a retraction describing the change. Sharing a device identifier
alone does not authorize another session's history.

## 3. Continue on mobile

Connect the Android app to `http://YOUR_PC_IP:8000/api/v1`, sign in as Alex and open
the inquiry under Conversations. Send a reply, then refresh the same inquiry on
web to see it in the shared history.

To demonstrate cross-device linking instead, create another anonymous web inquiry
and leave that web session signed out. Choose Continue on mobile on web, then
Link web session on mobile. Scan the QR code or enter its code, review the account
and confirm. Codes expire after five minutes and can only be claimed once.
A phone login alone does not claim an unrelated anonymous web session.

## 4. Continue through a support call

Open `http://localhost:5174` and choose Start support call. Enter customer number
`1041`, continue, then enter demo PIN `1234` and verify. Select the existing inquiry.

Choose Hear inquiry status, request a follow-up and end the call. Refresh the case
on web and mobile to see the follow-up message and call timeline entries. Call
verification independently retrieves inquiries already linked to Alex; it does
not require another web-session handoff.

The call simulator uses browser speech with a written transcript. It does not
place a real phone call or schedule a callback.

## 5. Keep separate inquiries distinct

While signed in, create a credit-limit or card-replacement inquiry from Support
Center on web, or Support on mobile. It should appear as a separate conversation
from the billing dispute. A follow-up on one inquiry remains attached to that case.

## 6. Inspect the event history

Open CJEP Event Stream on web. Filter events, inspect an envelope, and review its
attribution versions and retractions. Copy or export event data as needed.

`valid_time` records when an action happened; `ingest_time` records when the backend
received it. An original anonymous envelope can still say orphan after its current
attribution is resolved. The journey and knowledge-gap API endpoints expose
historical attribution queries; their parameters are listed in the
[API docs](http://localhost:8000/docs).

The inspector is a demo-wide diagnostic view of synthetic events. Customer case
and journey endpoints apply session/customer access checks.

## Offline and restart behavior

With a case loaded on mobile, stop the backend and send a reply. It should remain
pending. Restart the API using the same database and return to mobile or refresh
to retry delivery. The message should appear once after acknowledgement.

Restarting the API preserves confirmed history. Do not delete `.data/wager.sqlite3`
or clear app data to recover pending actions. Call actions use their own explicit
acknowledgement and pending-End recovery, described in the
[call guide](apps/call/README.md).
