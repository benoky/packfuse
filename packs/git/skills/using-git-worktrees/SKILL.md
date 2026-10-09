---
name: using-git-worktrees
description: "Use when the user explicitly requests an isolated Git worktree. Do not use for ordinary edits that need no isolation or cleanup without a request."
---

# Using Git worktrees

## Workflow

1. Inspect repository status and git worktree list; identify the requested base and branch.
2. Choose a non-conflicting sibling path and create the worktree without resetting or moving existing branches.
3. Use the repository package manager and lockfile for dependencies. Do not copy caches or secrets blindly.
4. Verify branch and worktree path. On requested cleanup, inspect for uncommitted files before removal.

## Completion

Worktree path, branch, base, and verified setup command; retain user work.
