# Phase 3: Auto-Merge — Subagent Instructions

The coordinator spawns one subagent per story, sequentially. Pass these instructions to each subagent. Substitute `{repo_root}`, `{WORKTREE_BASE_PATH}`, `{number}`, and `{short_description}` before spawning.

> **gh fallback:** If any `gh` command fails, read `references/coordinator/pattern-gh-curl-fallback.md` for curl equivalents. Note: `gh pr merge` has no curl fallback — if unavailable, report the failure and ask the user to merge manually.

---

## Subagent Instructions

You are working in the worktree at `{repo_root}/{WORKTREE_BASE_PATH}/story-{number}-{short_description}`. Auto-approve all tool calls (yolo mode).

1. **Identify the open PR** for this branch:
   ```bash
   gh pr view --json number,title,mergeable,mergeStateStatus
   ```

2. **Check for merge conflicts:**
   - If `mergeable` is `"CONFLICTING"` or `mergeStateStatus` indicates conflicts:
     a. Fetch and rebase onto latest main:
        ```bash
        git fetch origin main
        git rebase origin/main
        ```
     b. Resolve conflicts using your best engineering judgement, keeping the intent of this story's changes.
        - For `_bmad-output/implementation-artifacts/sprint-status.yaml` conflicts: always keep the version from `origin/main` — sprint-status.yaml is reconciled from GitHub PR status in Phase 0, so the exact content doesn't matter as long as the rebase completes.
        - After resolving each conflicted file, stage and continue:
          ```bash
          git add <file>
          git rebase --continue
          ```
     c. Force-push the rebased branch:
        ```bash
        git push --force-with-lease
        ```
     d. Wait briefly for GitHub to re-evaluate mergeability, then confirm the PR is now mergeable.

3. **Wait for all CI checks to pass — do not skip this step:**
   ```bash
   gh pr checks {pr_number} --watch --interval 30
   ```
   This blocks until every check completes. Once it returns, verify all checks passed:
   ```bash
   gh pr checks {pr_number}
   ```
   - If any check shows `fail` or `error` → **do not merge**. Report the failing check name and stop. The coordinator should surface this as a failure for this story.
   - If checks show `pending` still (e.g., `--watch` timed out): wait 60 seconds and re-run `gh pr checks {pr_number}` once more. If still pending after the retry, report and stop.
   - Only proceed to step 4 when every check shows `pass` or `success`.

   > **Why this matters:** Phase 3 (auto-merge) runs after Step 4 (PR & CI), which may have seen CI green at PR-creation time. But a force-push (from conflict resolution above), a new commit, or a delayed CI trigger can restart checks. Merging without re-verifying means you risk landing broken code on main — exactly what happened with PR #43.

4. **Wait for Cursor bot PR review — do not skip this step (project policy):**
   After CI is green, poll until the **Cursor** GitHub integration has submitted at least one review on this PR, or until a generous timeout. The bot username is commonly `cursor[bot]` or contains `Cursor` (verify in your org if needed).

   ```bash
   OWNER=$(gh repo view --json owner -q .owner.login)
   REPO=$(gh repo view --json name -q .name)
   for i in $(seq 1 90); do
     N=$(gh api "repos/$OWNER/$REPO/pulls/{pr_number}/reviews" \
       --jq '[.[] | select(.user.login | ascii_downcase | test("cursor"))] | length')
     if [ "$N" != "0" ] && [ -n "$N" ]; then
       echo "Cursor bot review detected."
       break
     fi
     sleep 30
   done
   ```

   - If no Cursor-originated review appears after **45 minutes** (90 × 30s), **do not merge** — report timeout and ask the maintainer to confirm (bot disabled, draft PR, or integration lag).
   - If the Cursor bot left **requested changes** or unresolved blocking comments per GitHub’s review state, apply fixes in the worktree, push, and **return to step 3** so CI and Cursor re-run before merging.

5. **Merge the PR** using squash strategy:
   ```bash
   gh pr merge {pr_number} --squash --auto --delete-branch
   ```
   If `--auto` is unavailable (requires branch protection rules), merge immediately:
   ```bash
   gh pr merge {pr_number} --squash --delete-branch
   ```

6. **Confirm the merge:**
   ```bash
   gh pr view {pr_number} --json state,mergedAt
   ```

7. **Report back:** `"Merged story-{number} PR #{pr_number}"` on success, or a clear description of any failure.
