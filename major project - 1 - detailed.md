# Cross-Channel Journey Stitching with Late-Binding Identity and a Bitemporal Journey Store

**A systems engineering project in stream processing, entity resolution, and temporal databases.**

---

## 1. Abstract

Organisations that serve customers across multiple channels — mobile app, web, telephony, physical branch — need to reconstruct a single coherent view of what a customer did. The conventional approach treats this as a data integration problem: collect events from each channel, join them on a customer identifier, and render a unified timeline.

This project argues that framing is wrong, and that it fails in a specific and measurable way.

In real deployments, three things hold simultaneously. Identity is often **unknown at the moment an event occurs** and only becomes known later. Events **arrive out of chronological order**, sometimes by hours, because different channels synchronise on different schedules. And any conclusion computed from an incomplete view — a risk score, an escalation alert — **becomes silently wrong** when the missing information finally arrives.

The consequence is that after a service failure, an organisation cannot answer the most basic diagnostic question: _was the relevant information available to the agent at the time of contact, or not?_ Conventional pipelines overwrite the corrected identity going forward and discard the fact that it was ever unknown. The historical record looks perfect in hindsight, so the failure leaves no trace.

We reframe cross-channel journey stitching as a **distributed state problem over an unreliable stream** and build a system that stores not only what the customer did, but **what the system itself believed about that at every point in time**. This makes the previously invisible failure into a measurable quantity, which we call _knowledge gap at contact time_.

The system is built from established techniques — Fellegi-Sunter probabilistic record linkage, SQL:2011 system-versioned temporal tables, changelog retraction semantics from stream processing, and incremental view maintenance. The contribution is their composition and their application to a domain where, to our knowledge, they have not been combined.

---

## 2. Problem statement

### 2.1 Motivating scenario

A customer of a financial services provider raises a billing dispute. The interaction unfolds across four systems:

|Time|Channel|What happens|Identifier available|
|---|---|---|---|
|Mon 10:00|Web|Opens a dispute while **logged out**|Device fingerprint, IP only|
|Mon 10:47|Mobile app|Logs in, checks status|Authenticated session ID|
|Wed 14:20|Call centre|Phones support, explains again|Phone number (post-OTP)|
|Wed 20:15|Call centre|Transcript syncs to warehouse|(same interaction, +5h55m)|
|Thu 11:00|Branch|Visits in person, explains a third time|Card token, POS transaction ID|

Four channels, four identifier schemes, four different arrival delays.

### 2.2 The three failures, stated precisely

**F1 — Identity binds late.** At Mon 10:00 the web session carries no strong identifier. The system cannot attribute it to any customer. Attribution becomes possible only at Mon 10:47, when the same person authenticates from the same device. The binding of identity to an event is therefore _retroactive_: a fact about the past that is learned in the present.

Formally: for an event `e` occurring at time `t_e`, the attribution function `A(e)` is not computable at `t_e`. It becomes computable at some later time `t_bind > t_e`. A pipeline that evaluates `A(e)` once, at ingestion, and then discards the event as unattributable loses information permanently.

**F2 — Events arrive out of order.** The call transcript describes an event that _occurred_ at Wed 14:20 but _arrives_ at Wed 20:15. Any system that conflates "when it happened" with "when we received it" will place this event incorrectly on the timeline, or reject it as late-arriving data.

Formally: the event stream is not ordered by event time. For events `e₁, e₂` with occurrence times `t₁ < t₂`, arrival order may be `e₂` then `e₁`. The delay distribution differs per channel and is heavy-tailed for batch-synchronised sources.

**F3 — Derived conclusions go stale silently.** Suppose a friction score `S(c)` for customer `c` is computed at Mon 10:30. At that moment, the Mon 10:00 web event is unattributed, so it is not an input to `S`. When the event is bound to `c` at 10:47, `S` is now computed from a stale input set — but nothing recomputes it, and nothing records that it was ever wrong.

This is the failure that compounds. By Wed 14:20 the agent handling the call sees whatever the pipeline last wrote. If that view was assembled before the binding, the agent is operating on incomplete history and does not know it.

### 2.3 The diagnostic question that cannot currently be answered

After a service failure, the natural question is: **"Was the information there, and did we act on it?"**

Conventional architectures cannot answer this, because they store only the _current_ best view. Once the Mon 10:00 event is correctly attributed, the timeline shows it in the right place, and the record of it having been invisible at Wed 14:20 is gone.

Answering this question requires storing the system's own belief state as a function of time. That is the core requirement this project addresses.

### 2.4 Reframing

> Cross-channel journey stitching is not a join problem. It is a **state problem over an unreliable stream** — characterised by late binding, late arrival, revision, and invalidation.

---

## 3. Related work and theoretical foundations

This project sits at the intersection of four established research areas. We use results from each; we invent no new algorithms.

### 3.1 Probabilistic record linkage

Fellegi and Sunter (1969) formalised record linkage as a statistical decision problem. Given a candidate pair of records, each comparison field contributes a log-likelihood ratio (`m`-probability over `u`-probability) and these sum to a match weight. Thresholds partition pairs into matches, possible matches, and non-matches.

The framework is attractive here for two reasons: it is **unsupervised** (parameters estimated via expectation-maximisation, no labelled training pairs required) and it is **explainable** (every decision decomposes into per-field contributions). In a regulated domain, an auditable match is worth more than a marginally more accurate opaque one.

Modern implementations such as Splink apply this at national scale. Candidate generation uses _blocking_ — restricting comparison to record pairs agreeing on some key — which bounds cost at O(n·k) rather than O(n²).

### 3.2 Temporal databases

Snodgrass and subsequent work established the distinction between **valid time** (when a fact was true in the modelled world) and **transaction time** (when the database recorded it). A _bitemporal_ relation carries both. SQL:2011 standardised system-versioned tables, implemented in PostgreSQL using range types with exclusion constraints.

The canonical motivation for bitemporality is regulatory reconstruction: _what did our records say on this date?_ We apply it to a different question: _what did our system believe about this customer's identity at this instant?_

### 3.3 Stream processing with event time and retraction

Akidau et al. (2015) established the now-standard model for out-of-order streams: separate event time from processing time, use **watermarks** to estimate completeness, and define an **allowed lateness** window after which late data is dropped.

Separately, stream processors that maintain aggregates over changing inputs (Apache Flink, Kafka Streams) use **changelog semantics**: when a previously emitted result becomes wrong, the system emits a retraction (a negative record cancelling the prior assertion) followed by the corrected value. Downstream consumers converge without replaying history.

We apply retraction semantics not to aggregate values but to **identity attribution** itself.

### 3.4 Conversation disentanglement

Elsner and Charniak (2008) and Kummerfeld et al. (2019) address the problem of separating interleaved conversations in a shared channel: given a stream of chat messages from multiple simultaneous discussions, partition them into coherent threads.

The structural analogy to our problem is exact. A customer pursuing two independent matters concurrently — a dispute and a credit limit request — generates interleaved events. Collapsed into a single timeline, the second matter's first contact falsely appears as an unresolved repeat of the first. We transplant the disentanglement formulation, and its established evaluation metrics, onto cross-channel service events.

### 3.5 Incremental view maintenance

Differential Dataflow (McSherry et al., 2013) and systems built on it maintain materialised views under changing inputs by propagating only the _differences_, recomputing exactly the affected portion of the dependency graph.

We apply this pattern at a coarser granularity: derived artifacts record the input event identifiers they were computed from, and a revision walks that lineage graph.

### 3.6 Statement of contribution

To be precise about what is and is not novel:

**Not novel (used off the shelf):** Fellegi-Sunter linkage, bitemporal storage, event-time watermarking, retraction semantics, conversation disentanglement, incremental view maintenance.

**The contribution of this project:**

1. **Applying bitemporal versioning to identity attribution specifically**, so that "who this event belongs to" is itself a time-varying fact with full version history, rather than a mutable field. This makes identity revision a first-class, queryable, auditable event.
    
2. **A novel derived metric — `knowledge_gap_at_contact_time`** — defined as the difference between the set of events attributable to a customer as known _now_ and as known _at the moment a contact began_. This quantity is not computable without an AS-OF store over attribution, and we are not aware of prior work that defines or measures it.
    
3. **The composition itself**: demonstrating that late-binding identity, bitemporal storage, intent threading, and lineage-tracked invalidation form a coherent architecture in which each mechanism addresses one identified failure mode, with an empirical evaluation of each against generated ground truth.
    

This is an engineering contribution rather than a theoretical one. The claim is that the composition is useful and measurable, not that any component advances the state of the art in isolation.

---

## 4. Proposed solution

Four mechanisms, one per identified failure.

```
FAILURE                          MECHANISM
────────────────────────────────────────────────────────────
F1  identity binds late     →    Late-binding identity
                                 with retractions
F2  out-of-order arrival    →    Bitemporal journey store
F3  stale conclusions       →    Lineage-tracked invalidation
    (plus) false repeats    →    Intent threading
```

### 4.1 Late-binding identity with retractions

Every event carries an explicit `identity_state`:

|State|Condition|Meaning|
|---|---|---|
|`resolved`|Strong key present, or probabilistic match ≥ 0.95|Confidently attributed|
|`provisional`|Probabilistic match in [0.70, 0.95)|Attributed with recorded confidence and evidence|
|`orphan`|Match < 0.70, or no signals|Unattributed — **retained, never discarded**|

Orphan events enter a **pending attribution buffer** indexed on weak signals: device fingerprint hash, IP/ASN, phone suffix, coarse time bucket.

When a strong identifier subsequently appears for the same person, a **binding event** fires: the buffer is scanned, matching orphans are claimed, and their attribution is revised retroactively.

Critically, downstream consumers do not receive a silent overwrite. They receive a **retraction pair**:

```
(−)  event E7731 · identity_state = orphan          ← cancels prior assertion
(+)  event E7731 · customer = C1041 · sys_time = 10:47   ← asserts new state
```

This is the changelog convention already used by mature stream processors. It allows any downstream consumer to converge on the correct state without replaying the full history, and it makes the revision itself an observable, loggable event.

The buffer is bounded by event-time watermarks and a configurable **allowed lateness** window (default 72 hours), after which orphans expire and are no longer claimable. This bounds memory and retraction volume.

### 4.2 Bitemporal journey store

Every attribution fact carries two independent time axes:

- **`valid_time`** — when the event occurred in the world
- **`system_time`** — when the system learned it, _including when it learned whose it was_

This makes the timeline queryable **as of any past instant**:

```sql
SELECT * FROM event_attribution
 WHERE event_id = $1
   AND sys_period @> $2::timestamptz;   -- what we believed at $2
```

Comparing the AS-OF view at a contact time against the current view yields the delta we call **knowledge gap at contact time** — the quantity of relevant history that was invisible to the agent at the moment of contact.

```
        system_time
        (when we learned it)
            ▲
            │                                    ● branch
            │                        ● transcript
            │                        │  valid 14:20, learned 20:15
   ─────────┼────────────────────────┼──────────  AS-OF cut at WED 14:20
            │                        ● call (14:20)
            │
            │   ● ─────────► ●   retroactive attribution
            │   ○ orphan ingested (10:00, unattributed)
            │
            └──────────────────────────────────────►  valid_time
              MON 10:00      WED 14:20      THU 11:00      (when it happened)

    Points above the diagonal were learned after they occurred.
    The vertical distance from the diagonal is the attribution lag.
```

**Implementation.** SQL:2011 system-versioned temporal tables in PostgreSQL 16, using `tstzrange` columns with `btree_gist` exclusion constraints so the database itself guarantees no two versions of a fact overlap in system time. The identity graph is maintained as a **versioned union-find** structure, making cluster merges reversible with full provenance.

This is deliberately conventional technology. The technique is not the invention; the domain of application is.

### 4.3 Intent threading

A customer pursuing a dispute and separately requesting a credit limit increase generates two logically independent sequences. Merged into one timeline, the second sequence's first contact reads as an unresolved repeat of the first, and every metric built on repeat-contact counting is corrupted.

Each event is assigned to a **thread** by online single-pass clustering over three weighted signals:

|Signal|Weight|Strength|Basis|
|---|---|---|---|
|Referenced entity|0.60|Near-deterministic|Shared transaction ID, case number, disputed amount|
|Intent similarity|0.25|Medium|Sentence-embedding cosine similarity over normalised event text|
|Temporal proximity|0.15|Weak|Exponentially decaying kernel (τ = 72 h)|

```
score(e, T) = 0.60·entity(e,T) + 0.25·cos(embed(e), centroid(T)) + 0.15·exp(−Δt/τ)
```

Assign to `argmax` if the best score exceeds threshold (0.45); otherwise open a new thread.

Because this is the conversation disentanglement problem in a new domain, it inherits an established evaluation methodology — cluster agreement F1 against reference labels — so the mechanism can be _measured_ rather than asserted.

### 4.4 Lineage-tracked invalidation

Every derived artifact — thread boundary, friction score, alert — stores the set of input event identifiers it was computed from, plus its dependencies on other artifacts.

When an event's attribution is revised, invalidation propagates through a topological walk of exactly the affected subgraph. Artifacts not downstream of the changed event are not recomputed.

```
event E7731 ─────┐
                 ├──► thread_boundary T1 ──► friction_score 41→68 ──► alert
event E8102 ─────┘         (invalidated)         (invalidated)      (emitted)
  (revised)

event E9022 ─────────────► churn_signal Q3
                              (untouched — not in the affected subgraph)
```

**An honest edge case, addressed rather than hidden.** Internal state converges under revision; a _delivered side effect_ does not. An alert already dispatched to an agent cannot be recalled. The system therefore emits a **correction record** referencing the original alert and tracks `post_revision_alert_precision` — the proportion of alerts that remain correct after all subsequent revisions land — as a first-class metric. We treat this as a property to be measured rather than a limitation to be concealed.

---

## 5. System architecture

```
  PRODUCERS:   app        web      call-centre     branch/POS
                 └──────────┴──────────┴───────────────┘
                                  │
                                  ▼
  ┌──────────────────────────────────────────────────────────┐
  │ [1] INGEST — one topic per channel                       │
  │     CustomerEvent { event_id, channel, valid_time,       │
  │                     ingest_time, identifiers{}, payload }│
  └──────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌──────────────────────────────────────────────────────────┐
  │ [2] NORMALISATION — shared intent taxonomy               │
  │     PII tokenised (HMAC, per-purpose salt)               │
  │     all downstream matching operates on tokens only      │
  └──────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌──────────────────────────────────────────────────────────┐
  │ [3] IDENTITY RESOLUTION                                  │
  │   A · deterministic hash join on strong keys → resolved  │
  │   B · Fellegi-Sunter probabilistic scoring on residue    │
  │       ≥ 0.95  → resolved                                 │
  │       0.70–0.95 → provisional (confidence + evidence)    │
  │       < 0.70  → orphan                                   │
  │                                                          │
  │   ┌──── PENDING ATTRIBUTION BUFFER ◄──── orphan ────┐    │
  │   │  indexed: device_hash, ip/asn, phone_tail,      │    │
  │   │           time_bucket                           │    │
  │   │  strong key arrives → BINDING EVENT             │    │
  │   └──────────► retraction pair ─────────────────────┘    │
  └──────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌──────────────────────────────────────────────────────────┐
  │ [4] BITEMPORAL JOURNEY STORE — PostgreSQL 16             │
  │     tstzrange + btree_gist exclusion constraints         │
  │     identity edges in a versioned union-find             │
  └──────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌──────────────────────────────────────────────────────────┐
  │ [5] THREADING & SCORING                                  │
  │     thread assignment: entity + embedding + time kernel  │
  │     friction signals: repeat contact, channel-switch     │
  │       velocity, unresolved dwell, silent drop            │
  │     lineage graph → targeted invalidation                │
  └──────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  ┌──────────────────────────────────────────────────────────┐
  │ [6] SERVING                                              │
  │     Redis hot path · REST + Server-Sent Events           │
  │     Web console with a system_time scrubber              │
  └──────────────────────────────────────────────────────────┘
```

Each layer is independently replaceable. The feedback edge from the attribution buffer back into resolution is the structural feature that distinguishes this from a linear pipeline: **past state is revisable, not append-only.**

---

## 6. Data model

The two tables below carry the core design. Everything else follows from them.

```sql
-- Immutable event log. Never updated.
CREATE TABLE events (
  event_id     TEXT PRIMARY KEY,
  channel      TEXT NOT NULL CHECK (channel IN ('app','web','call','branch')),
  valid_time   TIMESTAMPTZ NOT NULL,   -- when it happened
  ingest_time  TIMESTAMPTZ NOT NULL,   -- when we received it
  intent       TEXT NOT NULL,
  identifiers  JSONB NOT NULL,          -- tokenised
  payload      JSONB NOT NULL
);

-- Bitemporal attribution. The version history IS the contribution.
CREATE TABLE event_attribution (
  attribution_id BIGSERIAL PRIMARY KEY,
  event_id       TEXT NOT NULL REFERENCES events(event_id),
  customer_id    TEXT,                  -- NULL iff orphan
  identity_state TEXT NOT NULL
                 CHECK (identity_state IN ('resolved','provisional','orphan')),
  confidence     DOUBLE PRECISION,
  evidence       JSONB,                 -- per-field Fellegi-Sunter weights
  method         TEXT NOT NULL
                 CHECK (method IN ('deterministic','probabilistic',
                                   'binding','unmerge')),
  sys_period     TSTZRANGE NOT NULL,    -- [learned_at, superseded_at)

  -- The database itself guarantees non-overlapping versions.
  EXCLUDE USING gist (event_id WITH =, sys_period WITH &&)
);
```

The exclusion constraint is what makes the temporal guarantee structural rather than a matter of application discipline: it is impossible to insert two overlapping versions of the same event's attribution, regardless of application bugs.

**Revision is the only legal write path.** It never mutates `customer_id` in place:

```sql
-- 1. close the current version
UPDATE event_attribution
   SET sys_period = tstzrange(lower(sys_period), $now, '[)')
 WHERE event_id = $eid AND upper_inf(sys_period);

-- 2. open the new version
INSERT INTO event_attribution (...)
VALUES (..., tstzrange($now, NULL, '[)'));

-- 3. emit the retraction pair to downstream consumers
INSERT INTO retraction_log (...) VALUES (−1, old_state), (+1, new_state);
```

Derived artifacts carry their lineage:

```sql
CREATE TABLE derived_artifacts (
  artifact_key    TEXT NOT NULL,          -- 'friction:T1'
  artifact_type   TEXT NOT NULL,
  value           JSONB NOT NULL,
  input_event_ids TEXT[] NOT NULL,        -- lineage: what it was computed from
  depends_on      TEXT[] NOT NULL,        -- lineage: other artifacts
  sys_period      TSTZRANGE NOT NULL,
  EXCLUDE USING gist (artifact_key WITH =, sys_period WITH &&)
);
```

---

## 7. Execution trace

The motivating scenario, traced through the system:

```
MON 10:00   web · dispute opened · logged out
            no strong key → probabilistic score 0.61 → ORPHAN
            buffered on (device_hash, ip_asn)
            journey query for this customer returns nothing

MON 10:47   app · authenticated session
            strong key present → RESOLVED (deterministic)
            BINDING EVENT: buffer scanned, 10:00 orphan matches at 0.97
              attribution v1 closed at sys_time 10:47
              attribution v2 opened  (customer = C1041)
              retraction pair emitted:  (−) orphan   (+) C1041
            thread T1 opened, entity_key = txn_88213

WED 14:20   call · inbound, OTP verified
            RESOLVED → thread T1 → repeat_contact = 2
            friction_score(T1) = 41       (below alert threshold of 60)
            AS-OF query at 14:20 vs now → knowledge_gap = 0
              (the 10:00 event was already bound; the agent has it)

WED 20:15   call · transcript syncs · valid_time = 14:20 (5h55m late)
            within allowed lateness → stored at
              valid_time  = 14:20
              system_time = 20:15
            lineage: transcript ∈ inputs of friction:T1
            invalidation walks subgraph → recompute → 68
            68 ≥ 60 → alert emitted

THU 11:00   branch · in-person visit
            RESOLVED → T1 → repeat_contact = 3
            console pre-briefs the colleague with full cross-channel context
```

**Contrast case.** Had the Mon 10:47 login never occurred, the Monday session would remain orphaned. The Wednesday agent would see a first-time caller, and `knowledge_gap_at_contact_time` would report exactly how much history was invisible. That number is the deliverable — it converts an invisible failure into a ranked, evidenced, per-contact measurement.

---

## 8. Technology stack

Every component is open source and runs offline on commodity hardware. No GPU, no paid APIs, no cloud dependency.

|Layer|Implementation|Rationale|
|---|---|---|
|Event transport|Redpanda (Kafka API)|Single binary, no JVM, Kafka-compatible|
|Stream processing|Pure-Python stage functions with an async runner|Framework-free logic, directly unit-testable|
|Probabilistic linkage|Splink on DuckDB (Fellegi-Sunter, EM-trained)|Unsupervised; interpretable per-field weights|
|Identity graph|Versioned union-find; NetworkX for analysis|Reversible merges with provenance|
|Embeddings|`all-MiniLM-L6-v2` via ONNX (22M params, CPU)|Small, fast, no PyTorch dependency|
|Journey store|PostgreSQL 16 (`tstzrange` + `btree_gist`)|SQL:2011 temporal semantics, DB-enforced|
|Hot path cache|Redis|Sub-second console lookups|
|API|FastAPI + Server-Sent Events|Async, streaming updates to the console|
|Front end|React + visx|Custom timeline visualisation|
|Observability|OpenTelemetry|End-to-end latency measurement|
|Deployment|Docker Compose|Reproducible, fully offline|

**A note on Splink usage.** Splink is a batch record-linkage engine; invoking it per event would be architecturally inappropriate. The design trains a model offline, exports the learned `m`/`u` probabilities, and evaluates the Fellegi-Sunter weight sum inline at stream time. This preserves both the statistical model and its explainability while meeting streaming latency requirements.

**Production migration path.** Every prototype component has a named enterprise equivalent — Redpanda→Kafka, the async runner→Apache Flink, Splink/DuckDB→Splink/Spark, PostgreSQL→XTDB or partitioned PostgreSQL — and the resolution and threading logic is decoupled from all of them.

---

## 9. Evaluation methodology

### 9.1 Ground truth by construction

No real customer data exists for this project, and using any would raise privacy concerns that are avoidable. All data is **synthetically generated** with a hidden `true_customer_id` and `true_thread_id` per event.

We treat this as a methodological advantage rather than a limitation: because ground truth is generated, identity resolution accuracy is **measured against known labels, not asserted**. This is not possible for any approach that assumes its matching works.

**Structural enforcement.** Ground truth lives in a separate database schema. The pipeline's database role holds no permission on that schema, so label leakage is prevented by the database rather than by developer discipline. Only the evaluation process, running under a different role, may read it.

**Generator design.** 500 customers, ~12,000 events, 21 simulated days, deterministic under a seed. Scenario mix:

|Scenario|Share|Purpose|
|---|---|---|
|Clean single-channel|30%|Baseline|
|Clean handoff|20%|Strong key throughout|
|**Late-bind handoff**|15%|The flagship F1 case|
|Broken handoff|15%|Repeated self-explanation|
|**Concurrent intents**|10%|Tests threading; enables the ablation|
|Silent drop|5%|Abandonment without resolution|
|**Household collision**|5%|Two customers sharing device + IP|

The last row is methodologically essential. Without adversarial cases in which distinct individuals share weak signals, the false-merge rate is trivially zero and the metric is vacuous. A correct system must _not_ merge these pairs.

Per-channel arrival delays are sampled from realistic distributions: sub-second for app and web, bimodal for telephony (metadata immediate, transcript at +4 to +8 hours), and uniform 1–24 hours for branch batch sync.

### 9.2 Metrics

**Correctness** (pairwise, against hidden labels):

```
identity_f1        = 2PR/(P+R) over event pairs sharing a customer
false_merge_rate   = FP / (TP + FP)          target < 0.5%
thread_f1          = cluster agreement against true_thread_id
```

The false-merge target is deliberately strict: conflating two distinct individuals is a privacy incident, not a ranking error, and is weighted accordingly. We report it broken down by scenario, with household-collision cases isolated.

**Novel to this design:**

```
retroactive_attribution_yield
    = orphans eventually bound / orphans created
      → quantifies exactly what a forward-only pipeline discards

attribution_lag
    = binding_time − ingest_time,  reported as median and p95

knowledge_gap_at_contact_time
    for each contact C of customer X:
        gap = |events attributable to X before C, known now|
            − |the same set, known as-of C|
      → only computable with an AS-OF store

post_revision_alert_precision
    = alerts with no superseding correction / total alerts emitted
```

**Ablation.** The pipeline is run twice over an identical dataset with intent threading enabled and disabled, all else fixed:

```
repeat_contact_false_positive_rate
    = contacts flagged as repeat by the system AND not a true repeat
    / contacts flagged as repeat by the system
```

This isolates the contribution of threading. **The result is reported whichever way it falls.** If threading does not reduce the false-positive rate, that is a finding, and reporting it is more valuable than concealing it.

**Performance.** OpenTelemetry instrumentation on the stitch path, reporting p50/p99 for ingest→attribution, ingest→visible in API, and binding→all dependent artifacts revised.

### 9.3 Correctness invariants

Beyond metrics, a set of architectural invariants is verified by automated test:

|Invariant|Verification|
|---|---|
|Attributions are never mutated in place|Static analysis + property test on version continuity|
|Orphan events are never discarded|Every unattributed event has a buffer row|
|System time derives from an injectable clock|Static analysis: no wall-clock calls outside the clock module|
|Pipeline cannot read ground truth|Role-permission test expects an error|
|Every probabilistic match stores evidence|Database constraint|
|Delivered alerts are immutable|Static analysis: no delete or update on the alert table|

Property-based testing (Hypothesis) verifies that for any sequence of revisions, the `sys_period` ranges for a given event are contiguous, non-overlapping, and cover the interval from first write to the present.

---

## 10. Implementation plan

Ordered so that a working system exists early and capability accretes. Each phase has verifiable acceptance criteria.

|Phase|Deliverable|Acceptance criterion|
|---|---|---|
|1|Synthetic generator + schema|Deterministic under seed; all scenarios present; pipeline role cannot read truth schema|
|2|Ingest + normalisation|All events land in order; no raw PII anywhere in storage|
|3|Deterministic matching + timeline API|Coherent journey returned for a clean-handoff customer|
|4|Bitemporal store + AS-OF queries|Exclusion constraint rejects overlaps; AS-OF returns strictly fewer events than present|
|5|Probabilistic layer + orphan buffer|Every match carries evidence; **no household-collision pair auto-linked**|
|6|**Binding events + retraction propagation**|Orphan claimed on binding; retraction pair logged; two attribution versions exist|
|7|Intent threading|Concurrent-intent customers yield ≥ 2 threads; thread F1 computable|
|8|Friction scoring + lineage invalidation|Reference scenario reproduces 41→68; only affected artifacts recomputed|
|9|Console: swimlanes, scrubber, evidence panel|Scrubber visibly detaches orphan and reverts score|

**Phases 1–6 constitute a complete, demonstrable system** that validates the central thesis. Phases 7–9 add the differentiating capabilities. This ordering is deliberate: there is no single point of failure that leaves the project with nothing to show.

Estimated effort: one academic semester for a small team, with phases 1–6 occupying roughly the first half.

---

## 11. Deliverables

1. **Working system**, reproducible via `docker compose up`, running fully offline.
2. **Synthetic data generator** with configurable scale and seeded ground truth.
3. **Evaluation harness** producing all metrics in Section 9 as a reproducible report.
4. **Ablation study** isolating the contribution of intent threading.
5. **Web console** demonstrating AS-OF reconstruction via the system-time scrubber, per-field match evidence, and the knowledge-gap report.
6. **Technical report** documenting design decisions, measured results, and limitations.
7. **Test suite** including the architectural invariant checks and property-based temporal tests.

---

## 12. Scope and limitations

**In scope.** The full pipeline from synthetic event generation through identity resolution, bitemporal storage, threading, scoring, invalidation, and visualisation; and a quantitative evaluation of each mechanism.

**Out of scope, and why:**

- **Real production data.** Unavailable, and using real customer records would raise privacy issues that synthetic generation avoids entirely.
- **Supervised threading models.** No labelled production threads exist. The scoring interface is designed so a trained model can be substituted without pipeline changes.
- **Business impact quantification.** We deliberately make **no ROI or churn-reduction claim**. We have no access to any organisation's internal baselines, and inventing a figure would be dishonest. We measure mechanism accuracy and leave impact to be validated against production data by whoever holds it.
- **Telephony and branch integration.** These are simulated producers with modelled synchronisation lag rather than real system integrations.

**Known limitations:**

- Threshold values (0.95, 0.70, 0.45) are tuned against synthetic data and would require recalibration on real distributions.
- Allowed lateness bounds orphan retention; events arriving beyond that window are not bindable, which is a deliberate memory-bounding trade-off.
- Delivered side effects cannot be retracted. The system measures this rather than solving it, because it is not solvable.

---

## 13. Learning outcomes

The project exercises, at implementation depth:

- **Distributed systems** — event-time processing, watermarks, out-of-order streams, changelog and retraction semantics, eventual consistency under revision.
- **Database systems** — temporal data models, range types, exclusion constraints, SQL:2011 system versioning, indexing and query optimisation for temporal predicates.
- **Applied statistics** — the Fellegi-Sunter framework, expectation-maximisation for unsupervised parameter estimation, threshold selection under asymmetric cost.
- **Information retrieval / NLP** — sentence embeddings, online clustering, conversation disentanglement, cluster evaluation metrics.
- **Software engineering** — dependency-injected design for testability, property-based testing, invariant enforcement at the database layer, reproducible containerised deployment.
- **Evaluation methodology** — ground-truth construction, ablation design, adversarial test-case generation, honest reporting of negative results.

---

## 14. References

1. Fellegi, I. P., & Sunter, A. B. (1969). A Theory for Record Linkage. _Journal of the American Statistical Association_, 64(328), 1183–1210.
2. Snodgrass, R. T. (1999). _Developing Time-Oriented Database Applications in SQL_. Morgan Kaufmann.
3. ISO/IEC 9075:2011 (SQL:2011), Part 2: Foundation — system-versioned and application-time period tables.
4. Akidau, T., Bradshaw, R., Chambers, C., et al. (2015). The Dataflow Model: A Practical Approach to Balancing Correctness, Latency, and Cost in Massive-Scale, Unbounded, Out-of-Order Data Processing. _Proceedings of the VLDB Endowment_, 8(12).
5. Elsner, M., & Charniak, E. (2008). You Talking to Me? A Corpus and Algorithm for Conversation Disentanglement. _Proceedings of ACL_.
6. Kummerfeld, J. K., Gouravajhala, S. R., Peper, J., et al. (2019). A Large-Scale Corpus for Conversation Disentanglement. _Proceedings of ACL_.
7. McSherry, F., Murray, D. G., Isaacs, R., & Isard, M. (2013). Differential Dataflow. _Proceedings of CIDR_.
8. Kleppmann, M. (2017). _Designing Data-Intensive Applications_. O'Reilly. (Chapters 11–12: stream processing, derived data, and the changelog view.)
9. Splink — probabilistic record linkage library. UK Ministry of Justice. https://github.com/moj-analytical-services/splink
10. Apache Flink documentation — Dynamic Tables and changelog (retract) streams.