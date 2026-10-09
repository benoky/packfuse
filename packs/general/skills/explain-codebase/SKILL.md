---
name: explain-codebase
description: "Use when the user requests an architectural or module-level repository explanation. Do not use for a small diff impact check or onboarding file generation."
---

# Explain codebase

## Workflow

1. Clarify the question from context and choose representative entry points.
2. Trace data and control flow through the responsible modules, storage, and external boundaries.
3. Explain responsibilities and key contracts with concrete file and symbol references.
4. Distinguish confirmed behavior from inferred design intent. End with relevant extension points or unresolved questions.

## Completion

A focused codebase map with evidence, not an exhaustive file inventory.
