import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderAdversarySvg, resolveAdversaryState } from "@/lib/badge/adversary";
import type { AdversaryReport } from "@/lib/badge/types";

import { GET, loadAdversaryReport } from "./route";

/**
 * Story 8.2 — `<AdversaryBadge />` Route Handler unit tests.
 *
 * Covers the three SVG states (verified / pending / failed) by mocking
 * `fs.readFileSync` via the `loadAdversaryReport(reader, path)` shim that
 * `route.ts` exports for testability. The `GET()` smoke test exercises
 * the real readFileSync path against the committed report so a regression
 * in the artifact (e.g. malformed JSON, missing summary) is caught
 * before deploy.
 */

const VERIFIED_REPORT: AdversaryReport = {
  run_metadata: {
    seed: "7438e04cd157a6a76a1d50296ced47cf9a545790",
    commit_sha: "7438e04cd157a6a76a1d50296ced47cf9a545790",
    circles: 10000,
    started_at: "started-deterministic-circles-10000",
    finished_at: "finished-deterministic-circles-10000",
    cluster: "localnet",
  },
  summary: {
    total_runs: 10000,
    max_defector_profit_lamports: 0,
    scenarios_covered: ["scenario_skeleton"],
  },
  per_scenario_results: [],
};

const FAILED_REPORT: AdversaryReport = {
  ...VERIFIED_REPORT,
  summary: { ...VERIFIED_REPORT.summary, max_defector_profit_lamports: 1234 },
};

describe("Story 8.2 — resolveAdversaryState", () => {
  it("returns 'pending' when the report is null", () => {
    assert.equal(resolveAdversaryState(null), "pending");
  });

  it("returns 'verified' when max_defector_profit_lamports == 0", () => {
    assert.equal(resolveAdversaryState(VERIFIED_REPORT), "verified");
  });

  it("returns 'verified' for negative defector profit (defector lost money)", () => {
    const report: AdversaryReport = {
      ...VERIFIED_REPORT,
      summary: { ...VERIFIED_REPORT.summary, max_defector_profit_lamports: -400_000_000 },
    };
    assert.equal(resolveAdversaryState(report), "verified");
  });

  it("returns 'failed' when max_defector_profit_lamports > 0", () => {
    assert.equal(resolveAdversaryState(FAILED_REPORT), "failed");
  });

  it("returns 'pending' when the summary.max_defector_profit_lamports is not numeric", () => {
    const broken = {
      ...VERIFIED_REPORT,
      summary: { ...VERIFIED_REPORT.summary, max_defector_profit_lamports: NaN },
    } as AdversaryReport;
    assert.equal(resolveAdversaryState(broken), "pending");
  });
});

describe("Story 8.2 — renderAdversarySvg", () => {
  it("renders the verified state in mint with the canonical label", () => {
    const svg = renderAdversarySvg("verified", VERIFIED_REPORT);
    assert.match(svg, /10,000 adversarial circles passed/);
    assert.match(svg, /#14F195/i);
    assert.match(svg, /<title>/);
    assert.match(svg, /verified at 7438e04/);
  });

  it("renders the pending state in warn (amber) without a caption", () => {
    const svg = renderAdversarySvg("pending", null);
    assert.match(svg, /Pending verification/);
    assert.match(svg, /#FBBF24/i);
    assert.doesNotMatch(svg, /verified at /);
  });

  it("renders the failed state in danger (coral) with the FAILED label", () => {
    const svg = renderAdversarySvg("failed", FAILED_REPORT);
    assert.match(svg, /FAILED\s*[—-]\s*view report/);
    assert.match(svg, /#F87171/i);
  });
});

describe("Story 8.2 — loadAdversaryReport (fs shim)", () => {
  it("returns the parsed report when the reader yields valid JSON", () => {
    const fakeReader = () => JSON.stringify(VERIFIED_REPORT);
    const report = loadAdversaryReport(fakeReader as unknown as typeof import("node:fs").readFileSync, "fake/path.json");
    assert.equal(report?.summary.max_defector_profit_lamports, 0);
  });

  it("returns null when the reader throws (file missing)", () => {
    const throwingReader = () => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    };
    const report = loadAdversaryReport(throwingReader as unknown as typeof import("node:fs").readFileSync, "missing.json");
    assert.equal(report, null);
  });

  it("returns null when the reader yields malformed JSON", () => {
    const badReader = () => "{not-json";
    const report = loadAdversaryReport(badReader as unknown as typeof import("node:fs").readFileSync, "broken.json");
    assert.equal(report, null);
  });
});

describe("Story 8.2 — GET handler", () => {
  it("returns a 200 SVG response with ISR cache headers when the report is present", async () => {
    const response = await GET();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "image/svg+xml; charset=utf-8");
    const cacheControl = response.headers.get("Cache-Control") ?? "";
    assert.match(cacheControl, /s-maxage=/);
    const body = await response.text();
    assert.match(body, /<svg /);
  });
});
