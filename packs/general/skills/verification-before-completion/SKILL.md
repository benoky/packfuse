---
name: verification-before-completion
description: "Use when implementation is ready for a completion claim and final evidence is needed. Do not use for initial diagnosis, design, or rerunning checks whose valid results already cover an unchanged diff."
---

# Verification before completion

## Workflow

1. Match the final diff against acceptance criteria. Select checks that can disprove the claimed behavior.
2. Run relevant tests, typecheck, or build; reuse still-valid results when no covered code changed. Record commands and outcomes.
3. For user-visible UI changes, exercise the affected flow, including a relevant error or empty state. A screenshot alone is not behavioral verification.
4. Review the diff and report pass, fail, or not run with a reason. Stop optional testing once concrete remaining risks are covered.

## Completion

A concise verification record and remaining limitations. Never equate an attempted command or successful tool invocation with a passing test.
