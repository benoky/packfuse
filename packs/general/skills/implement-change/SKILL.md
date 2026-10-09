---
name: implement-change
description: "Use when a concrete, bounded code change is ready to implement. Do not use for open design decisions; use fix-ci for failing CI, systematic-debugging for an unknown cause, or TDD for an agreed behavior regression."
---

# Implement change

## Workflow

1. Read applicable repository instructions and inspect the current diff. Find the code path and an existing example of the desired pattern.
2. Translate the requested behavior into acceptance checks. Reuse an existing plan and protect unrelated user edits.
3. Implement the smallest complete change, including directly affected callers and contracts. Add a regression test when behavior changes.
4. Run targeted verification. Inspect the final diff for unrelated changes and report outcome, checks, and any unverified limitation.

## Completion

A reviewable change and evidence that the requested behavior works. Commit, push, and PR creation require the user request covered by the Git rule.
