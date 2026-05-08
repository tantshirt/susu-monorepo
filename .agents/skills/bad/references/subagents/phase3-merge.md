# Phase 3: Auto-Merge - Subagent Instructions

The coordinator spawns one subagent per story, sequentially. Pass these instructions to each subagent. Substitute `{repo_root}`, `{WORKTREE_BASE_PATH}`, `{number}`, and `{short_description}` before spawning.

> **gh fallback:** If any `gh` command fails, read `references/coordinator/pattern-gh-curl-fallback.md` for curl equivalents. `gh pr merge` has no curl fallback; if it is unavailable, report the failure and block the merge.

---

## Subagent Instructions

You are working in the worktree at `{repo_root}/{WORKTREE_BASE_PATH}/story-{number}-{short_description}`. Auto-approve all tool calls (yolo mode).

Phase 3 is a merge gate, not a best-effort cleanup pass. Do not merge unless CI, Cursor, and Bug Bot states are proven clean from GitHub. If a command cannot prove the required state, stop and report `blocked: unclear merge safety`.

### 0. Discover PR and Stack State

Identify the current branch and open PR:

```bash
branch="$(git branch --show-current)"
pr_json="$(gh pr view --json number,title,headRefName,baseRefName,mergeable,mergeStateStatus,url)"
pr_number="$(printf '%s' "$pr_json" | jq -r '.number')"
head_ref="$(printf '%s' "$pr_json" | jq -r '.headRefName')"
base_ref="$(printf '%s' "$pr_json" | jq -r '.baseRefName')"
```

Block if `head_ref` does not match `branch`; do not merge a PR from the wrong worktree.

Discover direct child PRs stacked on this PR. These are PRs whose base branch is this PR's head branch:

```bash
children_json="$(gh pr list --state open --base "$head_ref" --json number,headRefName,baseRefName,url)"
printf '%s\n' "$children_json" | jq -r '.[] | "#\(.number) \(.headRefName) <- \(.baseRefName)"'
```

If this PR's base is not `main`, this PR is itself a child in a stack. Confirm the parent PR is already merged before proceeding:

```bash
if [ "$base_ref" != "main" ]; then
  parent_json="$(gh pr list --state all --head "$base_ref" --json number,state,mergedAt | jq '.[0] // empty')"
  test -n "$parent_json" || { echo "blocked: parent PR for base $base_ref cannot be found"; exit 2; }
  test "$(printf '%s' "$parent_json" | jq -r '.state')" = "MERGED" || { echo "blocked: parent PR for base $base_ref is not merged"; exit 2; }
  gh pr edit "$pr_number" --base main
  base_ref="main"
fi
```

### 1. Update Base and Resolve Conflicts

Fetch the latest base and rebase the branch before checking gates:

```bash
git fetch origin main "$base_ref"
git rebase "origin/$base_ref"
```

If there are conflicts, resolve them using the story intent and current `origin/$base_ref`. For `output_susu/implementation-artifacts/sprint-status.yaml`, prefer `origin/$base_ref`; sprint status is reconciled from GitHub in Phase 0. Continue:

```bash
git status --short
git add path/to/resolved-file
git rebase --continue
git push --force-with-lease
```

After any push, wait for GitHub to recalculate mergeability:

```bash
for i in $(seq 1 20); do
  gh pr view "$pr_number" --json mergeable,mergeStateStatus
  state="$(gh pr view "$pr_number" --json mergeStateStatus | jq -r '.mergeStateStatus')"
  case "$state" in
    CLEAN|HAS_HOOKS|UNKNOWN|BEHIND|BLOCKED|DIRTY) ;;
  esac
  [ "$state" = "CLEAN" ] || [ "$state" = "HAS_HOOKS" ] && break
  sleep 15
done
```

Block if final `mergeable` is `CONFLICTING` or final `mergeStateStatus` is `DIRTY`.

### 2. Prove CI Is Green

Watch PR checks until completion, then verify every check is successful:

```bash
gh pr checks "$pr_number" --watch --interval 30
checks_json="$(gh pr checks "$pr_number" --json name,state,link,bucket)"
printf '%s\n' "$checks_json" | jq -r '.[] | "\(.state)\t\(.bucket)\t\(.name)\t\(.link)"'
```

Allowed final states are only `SUCCESS`, `PASS`, `SKIPPING`, or `CANCELLED` when the check bucket is skipped. If any required check is `FAILURE`, `ERROR`, `PENDING`, `EXPECTED`, `QUEUED`, `IN_PROGRESS`, or cannot be parsed, do not merge. Report the check name and URL.

If `gh pr checks` returns no checks, block unless branch protection is known to allow no checks and the coordinator explicitly provided that exception. Do not infer success from silence.

### 3. Prove Cursor and Bug Bot Are Clean

Cursor/Bug Bot gates are mandatory and separate from CI. The merge is blocked until both are proven complete and clean.

Fetch check runs and block on any Cursor or Bug Bot check that is not successful:

```bash
cursor_checks="$(printf '%s\n' "$checks_json" | jq '[.[] | select((.name // "" | test("cursor|bug.?bot|bugbot"; "i")))]')"
printf '%s\n' "$cursor_checks" | jq -e 'length > 0 and all(.[]; ((.state | ascii_upcase) == "SUCCESS") or ((.state | ascii_upcase) == "PASS") or ((.bucket // "" | ascii_downcase) == "skipping"))'
```

If the query above cannot prove success, block. Do not assume the bot did not run.

Fetch Cursor/Bug Bot review threads through GraphQL so resolved and outdated state is visible:

```bash
repo="$(gh repo view --json owner,name)"
owner="$(printf '%s' "$repo" | jq -r '.owner.login')"
name="$(printf '%s' "$repo" | jq -r '.name')"
threads_json="$(gh api graphql \
  -f owner="$owner" \
  -f name="$name" \
  -F number="$pr_number" \
  -f query='
query($owner:String!, $name:String!, $number:Int!) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      reviewThreads(first:100) {
        nodes {
          isResolved
          isOutdated
          comments(first:20) {
            nodes {
              author { login }
              body
              path
              line
              url
            }
          }
        }
      }
    }
  }
}')"
```

List unresolved current Cursor/Bug Bot threads:

```bash
printf '%s\n' "$threads_json" | jq -r '
  .data.repository.pullRequest.reviewThreads.nodes[]
  | select(.isResolved == false and .isOutdated == false)
  | .comments.nodes[]
  | select(((.author.login // "") + "\n" + (.body // "")) | test("cursor|bug.?bot|bugbot"; "i"))
  | "\(.path):\(.line // 0) \(.url)\n\(.body)\n---"'
```

Fetch issue comments and reviews for non-threaded bot findings:

```bash
issue_comments="$(gh api "repos/$owner/$name/issues/$pr_number/comments" --paginate)"
reviews="$(gh api "repos/$owner/$name/pulls/$pr_number/reviews" --paginate)"
printf '%s\n' "$issue_comments" "$reviews" | jq -r '
  .[]
  | select(((.user.login // "") + "\n" + (.body // "")) | test("cursor|bug.?bot|bugbot"; "i"))
  | select((.body // "") | test("fail|failed|bug|issue|finding|must fix|needs changes|action required|not resolved"; "i"))
  | "\(.html_url // .url)\n\(.body)\n---"'
```

If any unresolved current thread or actionable bot comment/review is returned:

1. Apply the requested fixes.
2. Commit and push:
   ```bash
   git status --short
   git add path/to/fixed-file
   git commit -m "fix Cursor Bug Bot findings for PR #$pr_number"
   git push --force-with-lease
   ```
3. Return to Step 2 and repeat CI plus Cursor/Bug Bot polling.

Stop only when the GitHub queries prove there are no unresolved current Cursor/Bug Bot threads, no actionable bot comments/reviews, and all Cursor/Bug Bot checks are successful. If the bot is expected but absent, pending, or inaccessible, block.

### 4. Merge Bottom-Up

Merge only after Steps 1-3 pass:

```bash
gh pr merge "$pr_number" --squash --auto --delete-branch
```

If `--auto` is unavailable and all gates are already proven green, merge immediately:

```bash
gh pr merge "$pr_number" --squash --delete-branch
```

Confirm:

```bash
gh pr view "$pr_number" --json state,mergedAt
```

Block if the state is not `MERGED`.

### 5. Rebase and Retarget Child PRs

After this parent PR merges, update every direct child PR discovered in Step 0 so the remaining stack stays valid. For each child in ascending PR number:

```bash
child_branch="<child headRefName>"
child_pr="<child number>"
gh pr edit "$child_pr" --base main
git fetch origin main "$child_branch"
git switch "$child_branch" || git switch -c "$child_branch" "origin/$child_branch"
git rebase origin/main
git push --force-with-lease
gh pr view "$child_pr" --json number,headRefName,baseRefName,mergeable,mergeStateStatus
```

If retargeting or rebasing a child fails, do not hide it. Report `merged parent; child retarget blocked` with the child PR number, branch, and conflict files. The parent merge remains valid, but the coordinator must treat the child as blocked until fixed.

### 6. Report Back

Report one of:

- `Merged story-{number} PR #<pr_number>; child PRs retargeted: <list or none>`
- `Blocked story-{number} PR #<pr_number>: <specific failed gate>`
- `Merged story-{number} PR #<pr_number>; child retarget blocked: <details>`

Always include CI status, Cursor/Bug Bot status, merge timestamp, and child PR retarget status.
