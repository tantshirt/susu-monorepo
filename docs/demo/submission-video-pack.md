# Susu Protocol Submission Video Pack

This pack is the recording source for the two required uploads:

- Demo video: live product, up to 3 minutes.
- Pitch video: public founder/product story, separate from the demo.

## Demo Setup

Enable the guided recording route in `apps/reference/.env.local`:

```bash
NEXT_PUBLIC_REFERENCE_STORY_DEMO=true
NEXT_PUBLIC_REFERENCE_STORY_DEMO_SIGNATURE=
```

If you already have a real devnet transaction signature, paste it into
`NEXT_PUBLIC_REFERENCE_STORY_DEMO_SIGNATURE`. Otherwise, paste it into the
proof input on the page during recording.

Use this route:

```text
http://localhost:3000/en/demo-video
```

The route is disabled on `mainnet-beta`. It is intended for devnet, testnet,
or localnet recording only.

## Demo Video Script

Target: 2:30 to 2:55.

### 0:00-0:12 - Opening

On screen: `http://localhost:3000/en/demo-video`

Say:

"This is Susu: rotating savings circles where the rules are public and
enforced consistently, instead of depending on whoever keeps the ledger in
their head."

### 0:12-0:42 - Why it matters

On screen: recording spine and guided demo banner.

Say:

"A susu is already familiar to many immigrant and diaspora families. Members
contribute on a schedule, and each person gets a turn receiving the pooled
amount. The problem is not the idea. The problem is trust: who paid, who
skipped, and whether the rules changed after money moved."

### 0:42-1:15 - Circle state

On screen: sample circle card, contribution amount, members, progress, and
rotation cards.

Say:

"Here is the circle in product form. The roster size, contribution amount,
current rotation, and claim timing are visible before anyone signs anything.
The early part of this page uses a guided demo state so we can move quickly,
but it is using the same reference app components."

### 1:15-1:45 - Commitment and protection

On screen: progress bar, collateral explanation, active rotation card.

Say:

"The key idea is commitment. The app shows what the group expects before a
transaction happens, and the protocol is designed so later turns carry more
protection. That makes missed payments less damaging to the rest of the group."

### 1:45-2:20 - Devnet proof

On screen: proof slot with a real devnet signature, then click the receipt link.

Say:

"Now I switch from the guided story to proof. This is a devnet transaction
signature from the Susu workflow. Opening it in Explorer shows the action on
Solana, so the record is publicly inspectable instead of living only in our
database."

If no real signature is available during the first take, say:

"For this recording pass, the proof slot is ready for a fresh devnet
signature. I would not claim this segment is on-chain until that signature is
filled."

### 2:20-2:55 - Close

On screen: GitHub README or app home page.

Say:

"This is open source and running as a devnet reference implementation: test
tokens, no production money, and no mainnet claims yet. The goal is to make a
savings tradition easier to inspect, fork, audit, and adapt for real
communities."

## Pitch Video Script

Target: 75 to 100 seconds.

### 0:00-0:15 - Personal hook

"I grew up around susu: informal rotating savings circles that helped families
pay tuition, handle emergencies, buy household goods, or start something
small. It worked because people trusted each other - until that trust was
tested."

### 0:15-0:35 - Problem

"The hard part is not the math. The hard part is transparency and commitment.
Who paid? Who skipped? Whose turn is next? Did the organizer change the rules?
Those questions can break a tool that many immigrant and diaspora communities
already understand."

### 0:35-0:55 - Product

"Susu Protocol is a digital version of that circle. Contributions, rotation,
collateral, and payout rules are written into public software on Solana. In
plain English, it is a glass vault and an automatic referee, not a private
spreadsheet."

### 0:55-1:15 - Proof

"Today it is an open-source reference implementation on devnet. That means
real product screens, inspectable program logic, test-token flows, and public
transaction proof when actions are run against the network."

### 1:15-1:35 - Why me

"I am building this from lived experience with these savings traditions and
from hands-on implementation work across the protocol, SDK, verification
artifacts, and reference app. Informal finance deserves serious engineering,
but the explanation should still feel simple enough for a family member to
understand."

### Close

"Susu Protocol is open source. The first step is not replacing communities. It
is giving them clearer rules and receipts they can trust."

## Upload Metadata

Demo video title:

```text
Susu Protocol Demo - Open-source rotating savings circles on Solana devnet
```

Demo video description:

```text
Susu Protocol is an open-source reference implementation for rotating savings
circles with public rules, simulated product state for the walkthrough, and a
devnet proof slot for verifiable transaction receipts. This demo uses test
tokens only and does not claim mainnet readiness.

Repository: https://github.com/tantshirt/susu-monorepo
```

Pitch video title:

```text
Susu Protocol Pitch - Transparent community savings circles
```

Pitch video description:

```text
Susu Protocol brings the familiar susu / ROSCA savings-circle model into an
open-source devnet reference implementation. The project focuses on visible
rules, contribution commitments, rotation clarity, and receipts communities
can inspect.

Repository: https://github.com/tantshirt/susu-monorepo
```

Tags:

```text
susu, rosca, solana, open source, community finance, diaspora, devnet,
blockchain, savings circles
```

## Final Rehearsal Checklist

1. Start the app with story demo mode enabled.
2. Open `http://localhost:3000/en/demo-video`.
3. Keep the browser at 125% zoom or higher if recording at 1080p.
4. Record one clean pass without a signature to test pacing.
5. Add the real devnet signature or record a proof insert.
6. Record the final demo screen capture.
7. Record the pitch separately with camera and clean audio.
8. Upload the two videos as separate public or unlisted links, depending on
   the submission form requirements.
