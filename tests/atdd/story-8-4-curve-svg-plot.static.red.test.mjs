import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const CURVE_SVG = 'docs/assets/curve-hero.svg';
const RENDER_SCRIPT = 'scripts/render-curve-hero.mjs';
const COMPONENT = 'apps/reference/components/susu/CurveVisualizer.tsx';
const DOCS_PAGE = 'apps/reference/app/[locale]/docs/curve/page.tsx';
const E2E_SPEC = 'apps/reference/tests/e2e/curve-interactive.spec.ts';
const LOCALES = ['en', 'vi', 'ar', 'es', 'yo', 'ht-kreyol'];
const MESSAGE_KEYS = [
  'docs.curve.title',
  'docs.curve.sliderN',
  'docs.curve.sliderContribution',
  'docs.curve.cartelToggle',
  'docs.curve.cartelCallout',
];

function read(path) {
  return readFileSync(path, 'utf8');
}

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
}

test('Story 8.4 README curve hero SVG is animated via SMIL or CSS keyframes (no JS)', () => {
  assert.ok(existsSync(CURVE_SVG), `${CURVE_SVG} must exist`);
  const svg = read(CURVE_SVG);
  const hasSmil = /<animate\b/i.test(svg);
  const hasKeyframes = /@keyframes\b/i.test(svg);
  assert.ok(hasSmil || hasKeyframes, 'curve hero SVG must use SMIL <animate> or CSS @keyframes');
  assert.doesNotMatch(svg, /<script[\s>]/i, 'curve hero SVG must not contain <script> tags');
  assert.match(svg, /prefers-reduced-motion/i, 'curve hero SVG must respect prefers-reduced-motion');
});

test('Story 8.4 render-curve-hero supports a --no-animation flag for forks', () => {
  assert.ok(existsSync(RENDER_SCRIPT), `${RENDER_SCRIPT} must exist`);
  const script = read(RENDER_SCRIPT);
  assert.match(script, /--no-animation/, 'render-curve-hero.mjs must accept --no-animation');
});

test('Story 8.4 CurveVisualizer exposes an interactive variant with sliders and cartel toggle', () => {
  assert.ok(existsSync(COMPONENT), `${COMPONENT} must exist`);
  const src = read(COMPONENT);
  assert.match(src, /"use client"|'use client'/, 'CurveVisualizer must be a Client Component when interactive');
  assert.match(src, /interactive\??:\s*boolean/, 'interactive prop must be declared on CurveVisualizerProps');
  assert.match(src, /useState/, 'interactive variant must use React state hooks');
  // Two range inputs (n + contribution). Accept either native range or shadcn Slider.
  const rangeMatches = src.match(/type=["']range["']/g) ?? [];
  const sliderMatches = src.match(/<Slider\b/g) ?? [];
  assert.ok(
    rangeMatches.length + sliderMatches.length >= 2,
    'interactive variant must render at least two range inputs (n + contribution)',
  );
  assert.match(src, /Cartel/i, 'cartel toggle must be present');
  assert.match(src, /\b4\b[\s\S]*\b5\b[\s\S]*\b6\b|\[4,\s*5,\s*6\]/, 'cartel highlight must cover positions 4..6');
});

test('Story 8.4 docs/curve route renders the interactive variant and is locale-aware', () => {
  assert.ok(existsSync(DOCS_PAGE), `${DOCS_PAGE} must exist`);
  const src = read(DOCS_PAGE);
  assert.match(src, /CurveVisualizer/, 'docs/curve page must import CurveVisualizer');
  assert.match(src, /interactive/, 'docs/curve page must enable the interactive prop');
  assert.match(src, /useTranslations|getTranslations/, 'docs/curve page must use next-intl translations');
});

test('Story 8.4 locale message files declare docs.curve.* keys for all six locales', () => {
  for (const locale of LOCALES) {
    const path = `apps/reference/messages/${locale}.json`;
    assert.ok(existsSync(path), `${path} must exist`);
    const json = JSON.parse(read(path));
    for (const key of MESSAGE_KEYS) {
      const value = getNested(json, key);
      assert.equal(typeof value, 'string', `${path} must declare a string for ${key}`);
      assert.ok(value.length > 0, `${path} value for ${key} must be non-empty`);
    }
  }
});

test('Story 8.4 Playwright spec covers sliders, cartel toggle, and reduced-motion fallback', () => {
  assert.ok(existsSync(E2E_SPEC), `${E2E_SPEC} must exist`);
  const spec = read(E2E_SPEC);
  assert.match(spec, /slider|range/i, 'spec must exercise slider/range inputs');
  assert.match(spec, /cartel/i, 'spec must toggle the cartel highlight');
  assert.match(spec, /reduced-motion|reducedMotion|prefers-reduced-motion/i, 'spec must cover the reduced-motion fallback');
});
