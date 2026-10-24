---
description: Minimal diffs; no unsolicited deps or abstractions; do not edit generated output
alwaysApply: true
---

- Prefer the smallest complete diff that follows existing patterns and preserves unrelated work.
- Do not add a dependency, wrapper, or abstraction the user did not ask for.
- Edit generated sources through their source/generator; do not hand-edit dist, .next, build, or coverage.
