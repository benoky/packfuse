---
name: docs-from-code
description: "Use when the user requests documentation of implemented behavior. Do not use for designing unimplemented APIs or modifying behavior to fit a document."
---

# Docs from code

## Workflow

1. Identify the intended reader and document boundary. Read implementation, exported contracts, and working examples.
2. Extract actual commands, parameters, defaults, errors, and constraints. Mark unknowns explicitly.
3. Write minimal executable examples without secrets and use repository terminology.
4. Check paths and links; run safe example commands when practical. Compare the document against code once more.

## Completion

Documentation grounded in code, with any unexecuted examples or missing facts stated.
