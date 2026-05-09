import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appRoot = 'apps/reference';
const rotationCardPath = `${appRoot}/components/susu/RotationCard.tsx`;
const memberAvatarPath = `${appRoot}/components/susu/MemberAvatar.tsx`;
const curveVizPath = `${appRoot}/components/susu/CurveVisualizer.tsx`;
const computeCurvePath = `${appRoot}/lib/curve/computeCollateralCurve.ts`;
const computeCurveTestPath = `${appRoot}/lib/curve/computeCollateralCurve.test.ts`;

// Directional classes forbidden — UX-DR40 RTL discipline.
const FORBID_DIRECTIONAL =
  /\b(?:left|right|pl|pr|ml|mr|border-l|border-r|rounded-l|rounded-r)-(?:\d+|\[?\w+\]?)\b/;

// Token discipline — UX-DR2 (Story 7.2). No hex anywhere.
const FORBID_HEX = /#[0-9a-fA-F]{3,8}\b/;

// Interactive handlers / sliders forbidden in the static-svg variant — Story 8.4 owns interactivity.
const FORBID_INTERACTIVE =
  /\b(?:addEventListener|onMouseMove|onMouseEnter|onMouseLeave|onPointerMove|onClick|onChange|<input\b|<button\b|requestAnimationFrame)\b/;

function read(p) {
  return readFileSync(p, 'utf8');
}

function assertExists(p) {
  assert.ok(existsSync(p), `${p} must exist`);
}

function assertNoDirectional(name, src) {
  assert.doesNotMatch(
    src,
    FORBID_DIRECTIONAL,
    `${name} must not contain directional Tailwind classes (use logical start-/end-/ps-/pe-)`,
  );
}

function assertNoHex(name, src) {
  assert.doesNotMatch(src, FORBID_HEX, `${name} must not hardcode hex colors (use tokens)`);
}

test('Story 7.11 RotationCard.tsx exists with expected shape', () => {
  assertExists(rotationCardPath);
  const src = read(rotationCardPath);
  assert.doesNotMatch(
    src,
    /^"use client";/m,
    'RotationCard must be a Server Component (no "use client" directive)',
  );
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+RotationCard\b/,
    'RotationCard must export a RotationCard component',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/card["']/,
    'RotationCard must import from the shadcn Card primitive',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/susu\/MemberAvatar["']/,
    'RotationCard must render MemberAvatar for the recipient',
  );
  for (const state of ['pending', 'active', 'claimed']) {
    assert.ok(
      src.includes(`"${state}"`) || src.includes(`'${state}'`),
      `RotationCard must reference the ${state} state value`,
    );
  }
  assert.ok(src.includes('rotation'), 'RotationCard must reference the rotation prop');
  assert.match(
    src,
    /useTranslations|getTranslations/,
    'RotationCard must consume next-intl translations for user-facing strings',
  );
  assertNoDirectional('RotationCard.tsx', src);
  assertNoHex('RotationCard.tsx', src);
});

test('Story 7.11 MemberAvatar.tsx exists with expected shape', () => {
  assertExists(memberAvatarPath);
  const src = read(memberAvatarPath);
  assert.match(src, /^"use client";/m, 'MemberAvatar must be a Client Component');
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+MemberAvatar\b/,
    'MemberAvatar must export a MemberAvatar component',
  );
  assert.match(
    src,
    /from\s+["']@\/components\/ui\/avatar["']/,
    'MemberAvatar must import from the shadcn Avatar primitive',
  );
  assert.ok(src.includes('pubkey'), 'MemberAvatar must accept a pubkey prop');
  assert.ok(
    src.includes('"sm"') || src.includes("'sm'"),
    'MemberAvatar must support the sm size variant',
  );
  assert.ok(
    src.includes('"md"') || src.includes("'md'"),
    'MemberAvatar must support the md size variant',
  );
  assert.ok(
    src.includes('"lg"') || src.includes("'lg'"),
    'MemberAvatar must support the lg size variant',
  );
  assertNoDirectional('MemberAvatar.tsx', src);
  assertNoHex('MemberAvatar.tsx', src);
});

test('Story 7.11 CurveVisualizer.tsx exposes a static SVG variant (interactive variant from Story 8.4 is opt-in)', () => {
  assertExists(curveVizPath);
  const src = read(curveVizPath);
  // Story 8.4 lands the interactive variant gated behind an `interactive`
  // prop (default `false`). The default behavior remains a static SVG
  // identical to the Story 7.11 contract: no animation, no JS-driven
  // changes when consumers do not opt in. The component is allowed to
  // import client-side hooks in the same file because the interactive
  // controls are gated behind the prop.
  assert.match(
    src,
    /export\s+(?:default\s+)?(?:function|const)\s+CurveVisualizer\b/,
    'CurveVisualizer must export a CurveVisualizer component',
  );
  assert.match(src, /<svg\b/, 'CurveVisualizer must render an <svg> element');
  assert.match(
    src,
    /role=["']img["']/,
    'CurveVisualizer must mark the SVG with role="img" for a11y',
  );
  assert.match(src, /aria-label=/, 'CurveVisualizer must provide an aria-label');
  assert.match(src, /<rect\b/, 'CurveVisualizer must render <rect> bar elements');
  assert.ok(
    src.includes('contribution') && src.includes('n'),
    'CurveVisualizer must reference the contribution and n props',
  );
  // The interactive variant from Story 8.4 introduces sliders + a cartel
  // toggle gated behind an `interactive` prop. The static variant must
  // remain reachable: the file must declare an `interactive` prop (so
  // the static path is still the default behavior).
  assert.match(
    src,
    /interactive\??:\s*boolean/,
    'CurveVisualizer must declare an `interactive` prop so the static variant remains opt-out (Story 8.4)',
  );
  assertNoDirectional('CurveVisualizer.tsx', src);
  assertNoHex('CurveVisualizer.tsx', src);
});

test('Story 7.11 computeCollateralCurve.ts exists as a pure function port of programs/susu/src/curve.rs', () => {
  assertExists(computeCurvePath);
  const src = read(computeCurvePath);
  assert.match(
    src,
    /export\s+function\s+computeCollateralCurve\b/,
    'computeCollateralCurve must be a named exported function',
  );
  // Closed form: factor = 2*n - 1 - i. Allow either numeric literal style.
  assert.match(
    src,
    /2\s*\*\s*n\s*-\s*1\s*-\s*i|2n\s*-\s*1\s*-\s*i/,
    'computeCollateralCurve must implement the canonical closed form 2*n - 1 - i',
  );
  assert.doesNotMatch(
    src,
    /from\s+["']react["']/,
    'computeCollateralCurve must be a pure function (no react imports)',
  );
});

test('Story 7.11 computeCollateralCurve.test.ts covers the canonical formula', () => {
  assertExists(computeCurveTestPath);
  const src = read(computeCurveTestPath);
  assert.match(
    src,
    /computeCollateralCurve/,
    'unit test must import the computeCollateralCurve helper',
  );
  assert.match(
    src,
    /2\s*\*\s*n\s*-\s*1\s*-\s*i|2n\s*-\s*1\s*-\s*i|2 \* n - 1 - i/,
    'unit test must reference the canonical formula 2*n - 1 - i',
  );
});
