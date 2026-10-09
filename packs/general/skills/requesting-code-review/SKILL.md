---
name: requesting-code-review
description: "Use when the user explicitly requests review of a change. Do not use for implementing or applying review comments."
---

# Requesting code review

## Workflow

1. Identify the baseline, diff, intended behavior, and relevant repository instructions.
2. Read changed paths with surrounding callers and tests. Use [the review checklist](references/checklist.md).
3. For each suspected defect, establish a concrete input or execution path that triggers it. Avoid unsupported claims and style-only nits.
4. Report findings by severity with file, symbol or line, consequence, and a suggested check. State if no actionable findings remain.

## Completion

A defect list and residual test gaps. Review does not authorize rewriting the change.
