---
name: test-driven-development
description: "Use when expected behavior and the change boundary are known and a regression test should drive the fix. Do not use for unknown causes (systematic-debugging), CI-only diagnosis (fix-ci), or prose/format-only edits."
---

# Test-driven development

## Workflow

1. Choose the smallest public behavior that fails. Reuse the repository test framework and realistic boundary fixtures.
2. Write one regression test and run it before changing production code. Confirm failure is the expected assertion, not a broken setup.
3. Make the smallest production change that passes. Run the new test and adjacent tests.
4. Refactor only if needed to finish the requested change, keeping checks green. Review [test antipatterns](references/antipatterns.md).

## Completion

The regression test, observed failure reason, passing command, and scope of verification. Do not claim a red/green sequence you did not execute.
