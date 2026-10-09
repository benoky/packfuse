---
name: author-ci
description: "Use when the user requests a new or changed CI workflow. Do not use for repairing an existing failed job (fix-ci)."
---

# Author CI

## Workflow

1. Read existing workflows, runtime versions, lockfiles, and required local checks.
2. Design the smallest workflow matching repository triggers and package manager. Give tokens only necessary permissions.
3. Use reproducible dependency installation and scope caches to the lockfile/runtime. Avoid exposing secrets to untrusted pull requests.
4. Validate workflow syntax and run underlying commands locally. State which runner-specific behavior still requires CI execution.

## Completion

A workflow with triggers, permissions, checks, and validation evidence.
