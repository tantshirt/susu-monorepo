/**
 * Susu reference app — adversary badge type contract.
 *
 * Mirrors the shape of `audits/adversary/adversary-report.json`
 * (Story 5.4). Only the fields read by `<AdversaryBadge />` (Story 8.2)
 * are typed here; the full schema is owned by the
 * `susu-adversary` Rust binary that emits the artifact.
 */

export type AdversaryRunMetadata = {
  /** Public deterministic seed used by the simulator (40-char commit SHA or 64-char hex). */
  seed: string;
  /** The commit SHA the simulator was seeded from. Surfaced in the badge caption. */
  commit_sha: string;
  /** Total adversarial circles run for the report (e.g. 10000). */
  circles: number;
  /** Deterministic marker placeholder; never a wall-clock timestamp. */
  started_at: string;
  /** Deterministic marker placeholder; never a wall-clock timestamp. */
  finished_at: string;
  /** Cluster the simulator targeted (e.g. "localnet"). */
  cluster: string;
};

export type AdversaryReportSummary = {
  /** Total runs across all scenarios. */
  total_runs: number;
  /**
   * The headline invariant: the maximum lamport profit a defector could
   * extract across every scenario. The badge flips to `verified` only
   * when this is exactly zero.
   */
  max_defector_profit_lamports: number;
  /** Names of the scenarios covered (sorted, stable). */
  scenarios_covered: string[];
};

export type AdversaryReport = {
  run_metadata: AdversaryRunMetadata;
  summary: AdversaryReportSummary;
  /**
   * Per-scenario results. Not used by the badge directly, but typed loosely
   * here to keep the contract honest about the artifact shape.
   */
  per_scenario_results: Array<{
    name: string;
    runs: number;
    max_defector_profit_lamports: number;
    [key: string]: unknown;
  }>;
};

/** Discriminator for the three SVG states the badge can render. */
export type AdversaryBadgeState = "verified" | "pending" | "failed";
