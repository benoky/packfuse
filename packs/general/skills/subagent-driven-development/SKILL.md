---
name: subagent-driven-development
description: "Use only when a plan has many independent tasks. Spawn a fresh implementer per task, then review. Do not implement everything in the main thread."
---

# Subagent-driven development
For each plan task: new implementer subagent, then reviewer using the reviewer agent prompt.
Do not pollute the parent context with implementation dumps.
