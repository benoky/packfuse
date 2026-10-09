---
name: resolve-merge-conflicts
description: "Use when an active merge or rebase has unresolved conflicts. Do not use for starting a merge, publishing a branch, or routine code implementation."
---

# Resolve merge conflicts

## Workflow

1. Inspect git status and the unmerged paths. Read the base and both sides to identify behavior each intended to preserve.
2. Resolve each hunk in its surrounding code; reconcile related callers, schemas, and generated sources as needed.
3. Check that conflict markers are gone and run the tests covering both changes. Do not take an entire side just to silence a conflict.
4. Report resolved files and remaining operation state. Stage, continue, abort, or commit only within the user-authorized workflow.

## Completion

Conflict-free code preserving both intended behaviors, with checks and any unresolved semantic decision stated.
