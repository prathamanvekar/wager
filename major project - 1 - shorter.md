# Why Customer Service Systems Forget What They Knew

**A project proposal**

---

## The problem, in one story

You call your bank about a wrong charge. You explained it on their website three days ago. You explained it to a different agent yesterday. Now you are explaining it a third time.

Everyone has experienced this. The usual assumption is that the company is disorganised, or that their systems "don't talk to each other."

We think something more specific and more interesting is going on, and that it has not been properly addressed.

---

## What is actually going wrong

Consider a realistic sequence:

|When|What happens|What the system knows|
|---|---|---|
|Monday 10:00|Customer opens a dispute on the website, **not logged in**|Nothing — no idea who this is|
|Monday 10:47|Same person logs into the mobile app|_Now_ it can tell who Monday 10:00 was|
|Wednesday 14:20|Customer phones support|Agent sees whatever was recorded|
|Wednesday 20:15|Call transcript finally syncs, ~6 hours late|The Wednesday call is only now fully recorded|
|Thursday 11:00|Customer visits a branch, explains a third time|—|

Three separate things go wrong here, and they are different problems:

**1. Identity arrives late.** At Monday 10:00 the system genuinely cannot know who this is. That is not a bug — the person was logged out. It only becomes knowable at 10:47.

**2. Information arrives out of order.** The call happened at 14:20. Its transcript arrived at 20:15. Different systems sync on different schedules, so the order things _happen_ and the order they _arrive_ are not the same.

**3. Conclusions quietly become wrong.** Any summary, score, or alert calculated before 10:47 was based on incomplete information. When the missing piece arrives, nothing goes back and recalculates. Nothing even records that it was ever wrong.

That third point is the one we find most interesting.

---

## The part nobody seems to handle

Here is the consequence.

After the customer complains, someone asks the obvious question: **"Why didn't the Wednesday agent see the Monday history?"**

Nobody can answer it.

By the time anyone investigates, the system has quietly corrected itself. The Monday event is now correctly attached to the customer. The timeline looks complete and correct. There is no trace that on Wednesday at 14:20, when it actually mattered, that information was invisible.

**The record looks perfect in hindsight, so the failure disappears.**

The system stores what it believes _now_. It does not store what it believed _then_. So the one question worth asking after a failure is unanswerable.

---

## Is this a real problem, or are we inventing one?

Three arguments that it is real. The first two are checkable, and the third is something you can verify yourself in a minute.

**It has a name and a cost.** Contact centres universally track _First Contact Resolution_ — the share of issues solved without the customer coming back. It is tracked precisely because repeat contacts are expensive and are treated as a quality failure. The existence of this industry-standard metric is itself evidence that repeat contacts are a recognised, measured, costly problem. _(We will cite specific published benchmark figures in the final report rather than quoting numbers we have not verified.)_

**The tools that claim to solve it solve a different problem.** Customer Data Platforms (Segment, Adobe, Salesforce and similar) do perform identity resolution and build unified customer profiles. But they resolve identity _going forward_ and overwrite the old value. They answer "who is this customer, and what is their history?" They do not answer "what did we believe about this customer last Tuesday at 2pm?"

**A test you can run.** Take any customer-view product and ask its documentation or vendor a single question: _can it reconstruct exactly what an agent would have seen at a specific past moment?_ Not what the records say happened — what the system believed at that instant. In our reading so far, the answer is consistently no. We would like to be proven wrong on this, and part of the project is a proper survey to establish it.

---

## Our idea

The core idea is small enough to state in one sentence:

> **Store two clocks instead of one.**

Every piece of information gets two timestamps:

- **When it happened** in the real world
- **When we found out about it** — including when we found out _who it belonged to_

That is the whole trick. Once you have both, you can ask the system: _"forget what you know now — show me what you knew on Wednesday at 14:20."_

And once you can ask that, you can measure the difference between the two answers. We call that the **knowledge gap**: how much relevant history was invisible to the agent at the moment the customer contacted them.

Right now that number does not exist anywhere. It cannot be calculated, because no system keeps the information needed to calculate it.

### What that gives you

Instead of "customers are unhappy, our repeat contact rate is high," an organisation gets a ranked list:

> _This contact on Wednesday at 14:20 was handled with 4 pieces of relevant history missing. Here is what was missing. Here is why it was missing. Here is when it eventually became visible._

That turns an invisible failure into a specific, evidenced, fixable one.

---

## What we would actually build

A working system, running end to end on a laptop:

1. **A simulator** producing realistic multi-channel customer activity — website, app, phone, branch — with realistic delays and realistic identity gaps.
2. **A matching engine** that links activity to customers, and importantly, _keeps_ activity it cannot yet identify instead of discarding it.
3. **A two-clock database** that records not just what happened but when we learned it, and can reconstruct any past view.
4. **A "late binding" mechanism**: when the system finally works out who an old anonymous session belonged to, it goes back, attaches it correctly, and recalculates anything that depended on the old, wrong picture.
5. **A visual console** with a slider. Drag it backwards and the screen shows what an agent would have seen at that moment — with the anonymous session detaching, and scores dropping back to their earlier, wrong values.

That slider is the demonstration. It makes an abstract idea immediately visible.

We are not inventing new algorithms. Every technique we need already exists in the literature — probabilistic record matching from statistics, versioned databases from the temporal database field, and out-of-order stream handling from distributed systems. **What appears to be new is combining them and applying them to this specific question.**

---

## How we would know if it works

This is the part we care most about getting right, because it is easy to build something that looks impressive and proves nothing.

Since we generate the data ourselves, **we know the correct answers**. Every simulated event carries a hidden label saying which customer it really belongs to. The system never sees those labels — we enforce that at the database permission level, so it is structurally impossible rather than just a promise.

That lets us measure honestly:

|What we measure|Why it matters|
|---|---|
|Matching accuracy (precision / recall)|Does it link the right activity to the right person?|
|**Wrong-merge rate**, target under 0.5%|Combining two different customers is a privacy incident, not a small error. We weight this heavily.|
|Recovered-history rate|What fraction of initially-anonymous activity do we eventually attach? This is exactly what a conventional system throws away.|
|Recovery delay|How long between an event happening and us working out whose it was?|
|**Knowledge gap**|The new metric — how much was invisible at the moment of contact?|

We will also run a **controlled comparison**: the same data through the system twice, once with a particular feature switched on and once off, to isolate whether that feature actually helps. **We will report that result whichever way it comes out.** If a component does not help, that is a legitimate finding and we would rather publish it than hide it.

We are deliberately making **no claim about business impact or cost savings**. We have no access to any real organisation's internal figures, and inventing a percentage would be dishonest. We measure whether the mechanism works. Whether it saves money is a separate question that needs real data we do not have.

---

## What we do not know yet

Being honest about the open questions, since these are what make it worth doing:

- **How aggressive should matching be?** Linking too eagerly merges two different people, which is a privacy incident. Linking too cautiously loses history. Where the right threshold sits is an empirical question we will have to investigate rather than assume.
- **How long should we hold on to unidentified activity?** Keeping anonymous sessions forever is not practical. A week? A month? What is lost at each cut-off? We do not know yet.
- **Does recalculating history actually help, or just create noise?** If a score is corrected after an alert has already been sent to an agent, the alert cannot be recalled. We suspect there is an interesting limit here around what can and cannot be fixed after the fact, and we would like to measure it rather than assume it away.
- **Is the knowledge gap metric actually useful?** We believe it is, but that is a hypothesis. It might turn out to be noisy or hard to act on.

We are treating these as things to find out, not things we have already decided.

---

## Why it suits an academic project

- It has **a clear, testable hypothesis**, not just "let us build an app."
- It **generates its own ground truth**, so results are measurable rather than asserted — which is unusual for a systems project and is the part we find most defensible.
- It draws on **four distinct areas**: statistical record matching, temporal databases, distributed stream processing, and text clustering. Each is a well-established field with real literature behind it.
- It **degrades gracefully**. The core matching-and-history system is useful on its own. The more advanced pieces build on top. There is no single point at which failure leaves us with nothing.
- The result is **demonstrable in thirty seconds** — the slider does the explaining.

---

## In one paragraph

Customer service systems record what they know now, but not what they knew at the time. So when something goes wrong, nobody can tell whether the information was available and ignored, or genuinely missing. We want to build a system that keeps two clocks — when something happened, and when we found out — so that any past moment can be reconstructed exactly. That makes it possible to measure, for the first time, how much relevant history was invisible to an agent at the moment a customer contacted them. We would build it, test it against data where we know the correct answers, and report honestly whether it works.