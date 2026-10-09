---
name: finishing-a-development-branch
description: "Use when the user explicitly requests finishing an implementation branch. Do not use for routine implementation, starting a branch, or automatic release."
---

# Finishing a development branch

## Workflow

1. Inspect branch, upstream, diff, and worktree status. Confirm the requested completion action from conversation context.
2. Run final relevant checks and summarize the change and known limitations.
3. Merge, open/update a PR, or leave the branch ready according to the authorized action. Do not infer publish permission from a generic status request.
4. Clean up only disposable branches/worktrees requested by the user and only after checking for uncommitted work.

## Completion

Completion status, verification, resulting branch/PR reference if created, and any work intentionally left.
