---
name: dev-containers
description: "Use when the user requests a reproducible development container. Do not use for production container deployment or a compose-only service setup."
---

# Dev containers

## Workflow

1. Inspect the existing runtime, package manager, developer commands, and host constraints.
2. Define a pinned base/runtime, working directory, non-root user where practical, mounts, and necessary forwarded ports.
3. Keep credentials and host-specific paths outside tracked configuration; use documented environment inputs.
4. Build/reopen the environment and run a representative project check, or state which host integration remains untested.

## Completion

Container configuration, startup instructions, environment requirements, and validation.
