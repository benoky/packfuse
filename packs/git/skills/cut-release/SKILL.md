---
name: cut-release
description: "Use when the user requests preparing a versioned release. Do not use for an ordinary commit, dependency update, or publishing without explicit authorization."
---

# Cut release

## Workflow

1. Read versioning conventions, release scripts, changelog, and the intended release scope.
2. Check the version increment against compatibility changes; update linked version fields consistently.
3. Run release checks and inspect the package contents for missing runtime files and unintended secrets or fixtures.
4. Prepare release notes; create tags or publish only when that action is explicitly authorized. Record exact artifacts and checks.

## Completion

Version, changelog, package validation, and clearly separated prepared/tagged/published status.
