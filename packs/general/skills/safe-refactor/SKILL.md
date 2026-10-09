---
name: safe-refactor
description: "Use when the requested change reorganizes code without changing observable behavior. Do not use for new behavior, unknown bugs, or broad cleanup alongside another task."
---

# Safe refactor

## Workflow

1. Define preserved contracts and inspect existing tests and consumers.
2. Run a baseline check; add characterization coverage only for a concrete behavior at risk.
3. Refactor in small coherent steps using the project naming and module conventions. Keep API and data contracts stable.
4. Rerun targeted checks and inspect call sites and exports. Explain any unavoidable behavior change before making it.

## Completion

A behavior-preserving diff, baseline and final checks, and any remaining coverage gap.
