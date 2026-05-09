import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const STORYBOARD_PATH = 'docs/demo/storyboard.md';
const VOICEOVER_EN_PATH = 'docs/demo/voiceover-en.txt';
const VOICEOVER_VI_PATH = 'docs/demo/voiceover-vi.txt';
const DEMO_MP4_PATH = 'apps/reference/public/demo.mp4';
const VTT_EN_PATH = 'apps/reference/public/demo.en.vtt';
const VTT_VI_PATH = 'apps/reference/public/demo.vi.vtt';
const POSTER_PATH = 'apps/reference/public/demo-poster.svg';
const README_PATH = 'README.md';
const GITATTRIBUTES_PATH = '.gitattributes';
const LINK_CHECK_CONFIG = '.markdown-link-check.json';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Story 8.6 storyboard exists with four-part structure and ~60-90s timing', () => {
  assert.ok(existsSync(STORYBOARD_PATH), `${STORYBOARD_PATH} must exist`);
  const sb = read(STORYBOARD_PATH);

  // Four numbered segments, each with a timing marker.
  // Match a permissive shape: segment heading containing "Segment 1" / "Segment 2" / etc.
  for (const n of [1, 2, 3, 4]) {
    const seg = new RegExp(`Segment\\s*${n}`, 'i');
    assert.match(sb, seg, `storyboard must contain "Segment ${n}" heading`);
  }

  // Timing budget references: 10s + 20s + 20s + 10s plus optional outro.
  // Don't pin a single numeric format; just require all four canonical durations appear.
  for (const dur of ['10s', '20s']) {
    const matches = sb.match(new RegExp(dur, 'g')) ?? [];
    assert.ok(matches.length >= 2, `storyboard must reference "${dur}" at least twice for the four-part timing budget`);
  }

  // Total length sentence should mention 60 and 90 (the AC range).
  assert.match(sb, /60[\s–-]*?90/, 'storyboard must explicitly state the 60–90s total length budget');

  // The storyboard must reference the four key visual sources.
  assert.match(sb, /rotating[\s-]*money/i, 'storyboard must reference the rotating-money animation segment');
  assert.match(sb, /curve/i, 'storyboard must reference the curve explainer segment');
  assert.match(sb, /examples\/with-privy\/(?:src\/)?index\.ts/, 'storyboard must reference examples/with-privy/index.ts code-typing segment');
  assert.match(sb, /skin/i, 'storyboard must reference the dual-skin toggle segment');
  assert.match(sb, /fork/i, 'storyboard must end with a fork-me CTA');
});

test('Story 8.6 voiceover scripts exist for English and Vietnamese', () => {
  assert.ok(existsSync(VOICEOVER_EN_PATH), `${VOICEOVER_EN_PATH} must exist`);
  assert.ok(existsSync(VOICEOVER_VI_PATH), `${VOICEOVER_VI_PATH} must exist`);

  const en = read(VOICEOVER_EN_PATH);
  // Canonical PRD opener phrase. Allow either curly or straight apostrophe.
  assert.match(en, /grandma['’]s savings circle/i, 'English voiceover must include the canonical opener "grandma\'s savings circle…"');
  assert.match(en, /math worked out this time/i, 'English voiceover must include the closing clause "with the math worked out this time"');

  // Vietnamese file must at minimum carry a TODO marker if not yet translated, plus matching timestamp structure.
  const vi = read(VOICEOVER_VI_PATH);
  assert.ok(vi.length > 0, 'Vietnamese voiceover file must not be empty');
  assert.match(vi, /\[\d{2}:\d{2}\]|\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/, 'Vietnamese voiceover must carry timestamp markers matching the storyboard structure');
});

test('Story 8.6 ships English + Vietnamese .vtt subtitle files alongside demo.mp4', () => {
  for (const p of [VTT_EN_PATH, VTT_VI_PATH]) {
    assert.ok(existsSync(p), `${p} must exist`);
    const vtt = read(p);
    assert.match(vtt, /^WEBVTT\b/, `${p} must start with the WEBVTT magic header`);
    // Must contain at least one cue with the WebVTT --> separator.
    assert.match(vtt, /\d{2}:\d{2}[:.]\d{2,3}\s+-->\s+\d{2}:\d{2}[:.]\d{2,3}/, `${p} must contain at least one WebVTT cue timing line`);
    // Storyboard has four segments — the .vtt must surface at least four cues so the structure mirrors the storyboard.
    const cueCount = (vtt.match(/-->/g) ?? []).length;
    assert.ok(cueCount >= 4, `${p} must contain at least four cues mirroring the four-part storyboard (found ${cueCount})`);
  }
});

test('Story 8.6 ships a self-hosted demo.mp4 placeholder', () => {
  assert.ok(existsSync(DEMO_MP4_PATH), `${DEMO_MP4_PATH} must exist as a placeholder until the real recording is committed`);
  const stat = statSync(DEMO_MP4_PATH);
  assert.ok(stat.isFile(), 'demo.mp4 must be a regular file');
  // Sanity-check the placeholder is small (≤256KB) so we don't accidentally check in a real video without LFS.
  assert.ok(stat.size <= 256 * 1024, `demo.mp4 placeholder must stay small (got ${stat.size} bytes); real recording belongs in Git LFS`);
});

test('Story 8.6 README replaces the watch-CTA with a click-to-play poster link', () => {
  const readme = read(README_PATH);
  const startIdx = readme.indexOf('<!-- susu:hero:watch-cta -->');
  const forkIdx = readme.indexOf('<!-- susu:hero:fork-cta -->');
  assert.notEqual(startIdx, -1, 'README must retain the susu:hero:watch-cta sentinel');
  assert.notEqual(forkIdx, -1, 'README must retain the susu:hero:fork-cta sentinel');
  const block = readme.slice(startIdx, forkIdx);

  // The block must contain a click-to-play link: <a href="...youtube..."> wrapping <img src="...demo-poster..." />
  assert.match(block, /<a\s+href="https?:\/\/(?:www\.)?youtube\.com\/[^"]+"/, 'watch-CTA block must contain a YouTube link');
  assert.match(block, /<img[^>]+src="(?:\.\/)?apps\/reference\/public\/demo-poster\.svg"/, 'watch-CTA block must embed the demo-poster.svg as the click-to-play image');
  assert.match(block, /alt="[^"]*demo[^"]*"/i, 'click-to-play image must have an alt attribute mentioning the demo');

  // Until the real YouTube ID lands, the placeholder URL must be clearly TODO-marked.
  assert.match(block, /TODO/i, 'watch-CTA block must contain a TODO marker for the real YouTube ID swap');
});

test('Story 8.6 ships a click-to-play poster SVG', () => {
  assert.ok(existsSync(POSTER_PATH), `${POSTER_PATH} must exist`);
  const svg = read(POSTER_PATH);
  assert.match(svg, /<svg\b/, 'poster must be an SVG');
  assert.match(svg, /Susu/i, 'poster must include the project name');
});

test('Story 8.6 .gitattributes declares *.mp4 as Git LFS-tracked', () => {
  assert.ok(existsSync(GITATTRIBUTES_PATH), `${GITATTRIBUTES_PATH} must exist`);
  const ga = read(GITATTRIBUTES_PATH);
  assert.match(ga, /\*\.mp4\s+filter=lfs/, '.gitattributes must declare "*.mp4 filter=lfs" so the placeholder swap stays history-safe');
});

test('Story 8.6 markdown-link-check ignores the placeholder YouTube TODO URL', () => {
  assert.ok(existsSync(LINK_CHECK_CONFIG), `${LINK_CHECK_CONFIG} must exist`);
  const cfg = JSON.parse(read(LINK_CHECK_CONFIG));
  assert.ok(Array.isArray(cfg.ignorePatterns), 'link-check config must have an ignorePatterns array');
  const matched = cfg.ignorePatterns.some(({ pattern }) => /youtube.*TODO|TODO.*youtube/i.test(pattern));
  assert.ok(matched, 'link-check ignorePatterns must include a rule for the placeholder YouTube TODO URL');
});

test('Story 8.6 hero block above susu:hero:end is not disturbed', () => {
  const readme = read(README_PATH);
  const heroEndIdx = readme.indexOf('<!-- susu:hero:end -->');
  assert.notEqual(heroEndIdx, -1, 'hero end sentinel must remain');
  const above = readme.slice(0, heroEndIdx);
  // Sanity: the link cluster from 8.5 sits BELOW the hero end and must still be present in the README.
  assert.match(above, /<!-- susu:hero:start -->/, 'hero start sentinel still present');
  assert.match(above, /<!-- susu:hero:curve-svg -->/, 'curve SVG marker (Story 8.4) preserved');
  assert.match(readme.slice(heroEndIdx), /<!-- susu:linkcluster:start -->/, 'link cluster (Story 8.5) preserved below hero');
});
