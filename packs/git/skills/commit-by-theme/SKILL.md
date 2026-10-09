---
name: commit-by-theme
description: "Use when the user explicitly requests commits. Do not use for push, release, or implementation without commit authorization."
---

# Commit by theme

## Workflow

1. Inspect git status and the full diff, including existing user edits. Identify logical themes.
2. Propose or select coherent commit groups; stage exact paths or hunks rather than the entire worktree.
3. Inspect the staged diff, check for secrets and unintended files, and run relevant checks.
4. Commit with a subject describing the change and a short body when useful. Report commit IDs and remaining unstaged changes.

## Completion

The requested coherent commits. Do not amend, push, or include unrelated edits without authorization.
