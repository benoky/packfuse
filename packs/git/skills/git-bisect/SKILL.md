---
name: git-bisect
description: "Use when the user requests finding the revision that introduced a regression. Do not use for an already known culprit or a destructive history rewrite."
---

# Git bisect

## Workflow

1. Identify verified good and bad revisions and a deterministic reproduction command.
2. Use a clean worktree or preserve existing changes without discarding them. Record the starting revision.
3. Run bisect with the reproduction, distinguishing regression failure from an unbuildable revision; use the skip result for the latter.
4. Validate the first bad revision and its parent, reset the bisect operation, and report evidence and any skipped-revision ambiguity.

## Completion

The culprit revision or narrowed range, reproduction, and restored worktree state.
