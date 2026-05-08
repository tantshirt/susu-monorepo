# Adversary Report Reproduction

`audits/adversary/adversary-report.json` is the canonical Story 5.4 adversary evidence artifact.

To reproduce it from a clean checkout, run:

```bash
COMMIT_SHA="$(git rev-parse HEAD)"
cargo run --bin susu-adversary --release -- --circles 10000 --seed $COMMIT_SHA --cluster localnet --output audits/adversary/adversary-report.json
```

The `--seed $COMMIT_SHA` value is the public deterministic seed. Git SHA-1 style 40-character commit IDs are accepted and expanded deterministically to the 32-byte ChaCha20 seed used by the simulator. A 64-character hexadecimal seed remains supported for direct 32-byte seed input.

The report is byte-deterministic for the same CLI inputs. Report metadata uses deterministic markers instead of wall-clock timestamps, scenario arrays are sorted by stable names, JSON is emitted with pretty formatting, and the file ends with a trailing newline.

CI runs `scripts/check-adversary-determinism.sh`, which generates the report twice with the same seed, compares bytes, and verifies `summary.max_defector_profit_lamports == 0`.

