---
name: writing-plans
description: "Use when an agreed design needs multiple ordered, verifiable changes. Do not use for an unresolved design, a one-line fix, or implementation already covered by a plan."
---

# Writing plans

## Workflow

1. Read the approved design and affected entry points; identify dependencies and existing test commands.
2. Use [the task template](references/task-template.md). Give each task a concrete outcome, expected files, dependencies, and one meaningful check.
3. Order tasks so contracts and migrations precede consumers. Identify compatibility and rollback requirements only where relevant.
4. Mark unknown paths or commands as items to inspect rather than inventing them. End with the first executable task; implementation belongs to implement-change.

## Completion

An ordered plan whose tasks can be reviewed independently. Save a plan only when requested or required by the project workflow.
