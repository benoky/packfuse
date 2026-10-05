---
name: fix-ci
description: "Use when CI/checks failed. Touch only failing jobs and use logs as evidence."
---

# Fix CI
1. Read the failing job logs, not just the check name.
2. Reproduce locally if possible.
3. Fix the failing check only. Do not drive-by lint unrelated files.
