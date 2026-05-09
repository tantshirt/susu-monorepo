# Susu 60–90s Demo Video — Storyboard

**Total length budget:** 60–90 seconds (target ~70s).
**Source-of-truth for the manual recording session.** When the recording happens, follow this storyboard verbatim so the subtitle `.vtt` files (`apps/reference/public/demo.{en,vi}.vtt`) and the voiceover scripts (`docs/demo/voiceover-{en,vi}.txt`) stay aligned.

The four-part structure mirrors AC of [GH issue #88 / Story 8.6](https://github.com/tantshirt/susu-monorepo/issues/88):

1. Rotating-money animation — ~10s
2. Curve explainer with the static SVG plot — ~20s
3. Live integration code from `examples/with-privy/index.ts` typed on screen — ~20s
4. Both reference-app skins toggled briefly — ~10s
5. Fork-me CTA outro — ~5–10s

Total: 65–70s.

---

## Segment 1 — Rotating-money animation (00:00 → 00:10, ~10s)

- **Visual:** Open on the existing rotating-money asset (use `docs/assets/curve-hero.svg` animated wrapper from Story 8.4 as a stand-in if a separate rotating-money asset is not yet committed). Coins/cash icons cycle around a circle of three avatars to communicate the ROSCA rotation.
- **Voiceover (EN):** _"Your grandma's savings circle, on a blockchain, with the math worked out this time."_
- **Subtitle cue:** `00:00.000 --> 00:10.000` (English + Vietnamese).
- **Audio direction:** Calm, declarative. No music ramp yet.
- **Transition out:** Fade to the static curve SVG.

## Segment 2 — Curve explainer (00:10 → 00:30, ~20s)

- **Visual:** Static `docs/assets/curve-hero.svg` plot of `C_i = contribution × (2n − 1 − i)` rendered full-frame. Highlight the recipient-with-the-most-to-gain bar in mint-green. Annotate that no rational defector profits at any rotation slot.
- **Voiceover (EN):** _"Susu uses a dynamic-collateral curve. The recipient with the most to gain posts the most collateral. We proved no rational defector profits — ten thousand adversarial circles, every rotation slot."_
- **Subtitle cue:** `00:10.000 --> 00:30.000`.
- **On-screen text overlay:** `C_i = contribution × (2n − 1 − i)` and the link `audits/adversary/adversary-report.json`.
- **Transition out:** Wipe to a code editor view.

## Segment 3 — Integration code from `examples/with-privy/src/index.ts` (00:30 → 00:50, ~20s)

- **Visual:** Screen-captured editor (VS Code or similar) typing the canonical lines from `examples/with-privy/src/index.ts`. Suggested condensed sequence:

  ```ts
  import { acceptInvite, contribute, createGroup, createSusuClient, postCollateral, signer } from '@susu/sdk';

  const client = createSusuClient({ cluster: 'devnet', rpc }).use(signer(privySigner));

  await createGroup(client, { creator, groupId: 6606n, n: 3, ... });
  await acceptInvite(client, { group, member });
  await postCollateral(client, { ...base, member });
  await contribute(client, { ...base, member });
  ```

- **Voiceover (EN):** _"Five SDK calls. Privy handles the wallet. Susu handles the curve. The rotation runs itself."_
- **Subtitle cue:** `00:30.000 --> 00:50.000`.
- **Pace:** Type at ~12 chars/s; the goal is to show the shape of the API, not every keystroke.
- **Transition out:** Cut to the running reference app at `localhost:3000`.

## Segment 4 — Dual-skin toggle in the reference app (00:50 → 01:00, ~10s)

- **Visual:** Reference app at `apps/reference/`. Show the neutral skin briefly, then click the skin toggle to switch to the diaspora skin. Highlight that the mint-green protocol-identity color stays constant across both.
- **Voiceover (EN):** _"Two skins, one protocol. Mint-green stays. Communities theme the rest."_
- **Subtitle cue:** `00:50.000 --> 01:00.000`.
- **Audio direction:** Music swells slightly into the outro.
- **Transition out:** Fade to fork CTA frame.

## Segment 5 — Fork-me CTA outro (01:00 → 01:08, ~5–10s)

- **Visual:** Static frame with the Susu wordmark, the fork URL `https://github.com/tantshirt/susu-monorepo/fork`, and the tagline _"Public from commit zero. MIT licensed. Audit-pending."_
- **Voiceover (EN):** _"Public from commit zero. Fork it. Run it. Ship a circle."_
- **Subtitle cue:** `01:00.000 --> 01:08.000`.
- **Audio direction:** Music tail.
- **End frame:** Hold for ~1s on the fork URL before cut.

---

## Recording checklist (manual content pass)

When the user is ready to record:

1. Record screen at 1920×1080, 30fps, mp4 (H.264).
2. Capture VO with a USB mic; bake VO into the mp4 track or keep separate `.aac` and mux later.
3. Replace `apps/reference/public/demo.mp4` (the placeholder is currently a 1KB stub; LFS attribute is already in `.gitattributes`, so `git add` will route it through LFS automatically).
4. Upload the same file to YouTube as unlisted-then-public; copy the `?v=…` ID.
5. Replace the `TODO_youtube_id` token in `README.md` (search for `youtube.com/watch?v=TODO_youtube_id`).
6. Re-run `pnpm link:check` locally to make sure the swap parses.
7. Adjust `apps/reference/public/demo.{en,vi}.vtt` cue timings if the recorded segments come in slightly off; the 4-cue skeleton already mirrors this storyboard.

## File slots locked by Story 8.6

| Slot | Purpose | Status after Story 8.6 |
| --- | --- | --- |
| `apps/reference/public/demo.mp4` | self-hosted video | placeholder stub (1 byte) |
| `apps/reference/public/demo.en.vtt` | English subtitles | timing skeleton |
| `apps/reference/public/demo.vi.vtt` | Vietnamese subtitles | timing skeleton + VI text TODO |
| `apps/reference/public/demo-poster.svg` | click-to-play poster | committed |
| `docs/demo/storyboard.md` | this file | committed |
| `docs/demo/voiceover-en.txt` | English voiceover script | committed |
| `docs/demo/voiceover-vi.txt` | Vietnamese voiceover script | committed (translation TODO) |
| `README.md` watch-CTA region | click-to-play link | committed |
| `.gitattributes` | LFS routing for *.mp4 | committed |
| `.markdown-link-check.json` | placeholder URL carve-out | committed |
