---
name: security-pass
description: "Use when the user requests a focused defensive review of a change. Do not use for exploit development, a full compliance audit, or unsolicited changes."
---

# Security pass

## Workflow

1. Scope the diff and trust boundaries; use [the checklist](references/checklist.md).
2. Trace authentication, object-level authorization, input handling, data storage, and secret exposure through actual call paths.
3. For each finding, name the affected boundary, concrete consequence, evidence, and proportionate remediation; separate uncertainty.
4. Recommend or run safe local negative tests with synthetic data. Report findings without changing production configuration.

## Completion

Prioritized, actionable defensive findings and verification gaps; no assurance beyond the reviewed scope.
