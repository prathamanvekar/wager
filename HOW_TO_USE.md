# How to Use Wager (Demo Walkthrough)

Open `http://localhost:5173/` in your browser to run the 4-step flagship demonstration:

---

### Step 1: File an Anonymous Dispute (Mon 10:00 Scenario)
1. Ensure the top status bar says **Anonymous Visitor** and shows an **ORPHAN** badge.
2. In the **Recent Account Transactions** table, find `txn_88213` ($142.50 at CloudScale SaaS) and click **Dispute Charge**.
3. Select a reason (e.g. *Unrecognized Charge*), type notes or keep default, and click **Submit Dispute Event**.
4. **What happened**: Wager does not discard the dispute. It retains it in the pending orphan buffer tagged with your browser device token (`tok_dev_...`).

---

### Step 2: Authenticate and Trigger Late Binding (Mon 10:47 Scenario)
1. In the top navigation bar, click **Sign In (C1041)**.
2. Select **Alex Mercer (`C1041`)** and click **Authenticate & Bind Identity**.
3. **What happened**:
   - The backend binding engine matches the device token from Step 1.
   - It closes the orphan version and asserts a resolved attribution to `C1041`.
   - A retraction pair `(−) orphan, (+) C1041` is emitted into the changelog.
   - Go to **Disputes & Cases** tab to see the retroactive binding milestone recorded in the case timeline.

---

### Step 3: Seed a Concurrent Intent (Threading Demonstration)
1. Click the **Support Center** tab.
2. Click **Launch Credit Request** under *Credit Limit Increase Request*.
3. Keep default $25,000 request and click **Submit Inquiry Thread**.
4. **What happened**: Creates a distinct journey thread (`credit_inquiry`) separate from the billing dispute, proving the system prevents false repeat-contact alerts for unrelated matters.

---

### Step 4: Inspect Bitemporal Events and Server Telemetry
1. Click the **CJEP Event Stream** tab.
2. Click any event to open the **CJEP Envelope Inspector** to see:
   - `valid_time` (when the customer acted)
   - `ingest_time` (when received)
   - `identifiers` (`device_id`, `session_id`, `ip_hash`)
   - `identity_state` (`orphan` vs. `resolved`)
   - Backend API ingestion response and changelog retractions
