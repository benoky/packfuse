---
name: systematic-debugging
description: "Use when behavior is wrong and its cause is unknown. Do not use for CI-only failures (fix-ci), intermittent tests (flaky-test), or a regression with a known fix (TDD)."
---

# Systematic debugging

## Workflow

1. Capture expected versus actual behavior and a reproducible command, input, or user flow. Record relevant environment versions.
2. Trace the failing path with logs and code. Separate observations from hypotheses; do not edit several suspected causes at once.
3. Choose the smallest experiment that distinguishes competing causes. Run it and record what it supports or rules out.
4. Once the cause is supported, add a focused regression test, make the minimal fix, and rerun the original reproduction plus affected checks.

## Completion

Root cause with evidence, reproduction, fix, and verification. If blocked, report the missing evidence and the next discriminating experiment.
