---
name: reproduce-minimal
description: "Use when the user asks for a minimal reproduction of a bug. Do not use for a fix whose failure is already captured by a focused regression test."
---

# Minimal reproduction

## Workflow

1. Capture the failing behavior and exact execution command before reducing anything.
2. Work in a separate fixture or temporary copy. Preserve the original failing case and user files.
3. Remove one unrelated component at a time and rerun the failure to retain the essential trigger.
4. Record runtime versions, minimal inputs, expected versus actual output, and cleanup steps. Remove secrets from shareable fixtures.

## Completion

A reproducible minimal case and one command that still demonstrates the issue.
