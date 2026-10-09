---
name: webapp-testing
description: "Use when the user explicitly requests browser verification of a local app. Do not use for unit-only tests or implementation without a browser-check request."
---

# Web app testing

## Workflow

1. Identify the existing start command, target URL, and a concrete user flow with expected results.
2. Use one available browser automation stack. Start the app only if needed and record the process for cleanup.
3. Exercise the primary flow plus a relevant invalid/empty case with semantic selectors and observable waits.
4. Capture errors and useful screenshots/traces without secrets. Stop only processes started for this task; report pass/fail and untested flows.

## Completion

Reproducible steps, observed outcomes, and focused evidence. Do not claim a flow passed from page-load success alone.
