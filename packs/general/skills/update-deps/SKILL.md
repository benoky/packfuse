---
name: update-deps
description: "Use when the user requests dependency upgrades. Do not use for routine installation, unrelated feature work, or guessing the latest version."
---

# Update dependencies

## Workflow

1. Inspect the current manifest, lockfile, supported runtime, and the requested upgrade boundary.
2. Check official release and migration notes for the chosen version. Identify breaking contracts before editing.
3. Upgrade one dependency or a required compatibility group through the project package manager; keep the lockfile consistent.
4. Run affected tests, typecheck, and build; summarize migrations and remaining risks before taking the next upgrade.

## Completion

Version changes, migration edits, and test outcomes. Never batch unrelated major upgrades.
