---
name: subagent-driven-development
description: "Use when the user explicitly invokes this workflow for an approved plan with independent tasks. Do not use for an unapproved design, a tiny change, or environments without delegation support."
---

# Subagent-driven development

## Workflow

1. Read the approved plan and identify dependencies, shared files, and acceptance checks.
2. Assign one owner and bounded scope per task. Run independent tasks concurrently only when they do not compete for the same files.
3. Have each implementer return changed files, validation, and unresolved issues. Review each result with the installed reviewer agent or equivalent explicit review.
4. Integrate in dependency order, resolve overlaps deliberately, and run the combined acceptance checks. If delegation is unavailable, report that and execute the plan sequentially.

## Completion

Integrated, reviewed changes with per-task and combined verification. Do not delegate authority beyond the user request.
