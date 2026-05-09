# ATDD — Story 8.6: 60-90s demo video production + embed (FR54, UX-DR26)

**GH Issue:** #88
**Branch:** `story-8-6-demo-video`

## Context & reality scope

This is a video-production story. Code agents cannot literally record a screen-cap video; the
recording is a manual artifact landed by a human. What this story DOES land:

1. **Storyboard + voiceover script** (English + Vietnamese stub) so the recording session is
   deterministic — anyone can pick up the storyboard and shoot the same 60–90s clip.
2. **Subtitle skeleton** as `.vtt` files with the storyboard's timing structure so the
   subtitle file does not have to be authored from scratch when the recording happens.
3. **Self-hosted `demo.mp4` placeholder** at `apps/reference/public/demo.mp4` plus a Git LFS
   attribute (`*.mp4 filter=lfs`) so the real recording can be swapped in without
   bloating git history.
4. **Click-to-play poster image** (`demo-poster.svg`) embedded in the README via an `<a>`
   wrapping `<img>` pattern, replacing the Story 8.1 watch-CTA placeholder.
5. **Markdown-link-check carve-out** for the placeholder YouTube URL so CI does not fail
   while we wait for the real upload.

The actual recording, real subtitle text translation, and real YouTube ID are deferred
to a manual content pass owned by the user — clearly TODO-marked.

## Acceptance criteria → static-test mapping

| AC (issue #88) | Static assertion |
| --- | --- |
| 60–90s total length | Storyboard sums to ≈70s and is documented in `docs/demo/storyboard.md` (test #1) |
| Opener voiceover matches PRD voice ("grandma's savings circle…") | Voiceover `.txt` files exist; English contains the canonical opener line (test #2) |
| Four-part storyboard (10s + 20s + 20s + 10s) | Storyboard contains four numbered segments with timing markers (test #1) |
| English + Vietnamese subtitles as `.vtt` | Both `.vtt` files exist alongside `demo.mp4` (test #3) |
| Hosted on YouTube + self-hosted `apps/reference/public/demo.mp4` | `demo.mp4` placeholder exists (test #4) and README has YouTube TODO link (test #5) |
| README embeds video with click-to-play poster | README contains `<a href=…youtube…><img …poster…></a>` markup inside the watch-CTA region (test #5); poster file exists (test #6) |
| ≤25MB or stored via Git LFS | `.gitattributes` declares `*.mp4 filter=lfs` (test #7) |

## Out of scope (intentionally deferred)

- The actual video recording / editing.
- A polished Vietnamese voiceover translation (file exists with TODO marker; correct VTT structure asserted, exact translation not).
- The real YouTube upload + the canonical `?v=…` ID (placeholder TODO link asserted; replacement is a content pass).
- A full-resolution poster PNG. SVG poster is fine for embedding and asserted in tests.

## Static red test

`tests/atdd/story-8-6-demo-video.static.red.test.mjs`
