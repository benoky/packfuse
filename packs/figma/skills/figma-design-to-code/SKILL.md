---
name: figma-design-to-code
description: "Use when the user explicitly requests implementing a Figma design. Do not use for inventing a new design or a task without a supplied design reference."
---

# Figma design to code

## Workflow

1. Resolve the exact file, node, and intended screen. Use the available Figma connection; request access only if missing.
2. Read layout, assets, component variants, typography, and tokens. Map them to the existing application design system.
3. Implement structural layout before details, with responsive and interactive states inferred only where clearly indicated; identify unknowns.
4. Compare the implementation against the supplied design and exercise the flow. Keep tokens and credentials out of source files.

## Completion

Traceable design-to-code mapping, implemented screen, and visual/behavior checks. Do not claim pixel parity without comparison.
