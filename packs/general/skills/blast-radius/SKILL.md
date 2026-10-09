---
name: blast-radius
description: "Use when the user requests impact analysis of a diff or proposed change. Do not use for implementing a change or a general repository tour."
---

# Blast radius

## Workflow

1. Identify the exact diff, public symbols, configuration keys, and persistent data touched.
2. Trace callers, imports, API clients, generated types, and user flows using repository search.
3. Rank concrete breakage paths by impact and evidence. Separate direct dependents from speculative risks.
4. Recommend the smallest verification set covering the identified boundaries; do not change files during analysis.

## Completion

A table of affected surface, evidence path, likely failure, and suggested check; state search boundaries.
