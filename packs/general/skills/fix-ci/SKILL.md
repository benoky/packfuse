---
name: fix-ci
description: "Use when a CI job or repository check fails. Do not use for a production bug without a failing check, a new CI workflow, or known flaky-test investigation."
---

# Fix CI

## Workflow

1. Read the exact failing job, step, exit code, and relevant logs. Check the triggering revision and runner/runtime configuration.
2. Reproduce the failing command using the same lockfile and relevant versions. Distinguish application, configuration, and infrastructure failures.
3. Fix the evidenced cause. Keep unrelated formatting, dependency upgrades, and passing jobs outside the change.
4. Rerun the failed command and directly affected checks. If remote access is unavailable, state that local checks do not prove the remote job passed.

## Completion

Failing step, cause, files changed, and local/remote verification status. Never resolve a failure by silently weakening its check.
