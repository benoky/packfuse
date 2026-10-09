---
name: flaky-test
description: "Use when a test intermittently fails under the same intended inputs. Do not use for deterministic failures, new test creation, or suppressing CI noise without diagnosis."
---

# Flaky test

## Workflow

1. Record failing seeds, order, timing, environment, and repetition counts.
2. Repeat the narrow test and compare isolated versus suite execution to distinguish timing, order, shared state, and external dependency causes.
3. Fix deterministic setup/cleanup or synchronization. Prefer controlled clocks and observable conditions over longer sleeps.
4. Repeat the reproduction after the fix. Quarantine only with explicit approval, a tracking issue, and a restoration condition.

## Completion

Reproduction rate, evidenced cause, fix, and post-fix sample size; do not claim finite runs prove absence of flakes.
