---
name: db-migration
description: "Use when a change modifies database schema or persistent data. Do not use for query tuning without schema changes or generic API design."
---

# DB migration

## Workflow

1. Inspect the current schema, data volume, database version, deployment order, and application compatibility needs.
2. Plan expand, backfill, validate, then contract where a rolling rollout requires it. Check lock duration and index creation behavior.
3. Define rollback or forward recovery explicitly; do not promise reversibility for lossy transformations. Keep backfills bounded and restartable.
4. Test on a representative local copy, including partially migrated state and application compatibility. Never run production migrations without authorization.

## Completion

Migration sequence, compatibility window, recovery strategy, and evidence from a representative test.
