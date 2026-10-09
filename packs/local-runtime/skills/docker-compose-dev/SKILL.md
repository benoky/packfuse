---
name: docker-compose-dev
description: "Use when the user requests local multi-service development setup. Do not use for production deployment or a single devcontainer-only task."
---

# Docker Compose for local development

## Workflow

1. Identify required services, supported images, ports, persistence, and application connection variables.
2. Define healthchecks and readiness behavior; use internal service names for container-to-container connections.
3. Use environment examples without secrets and document persistent volumes plus intentional cleanup commands.
4. Validate the compose configuration, start the services when authorized, and test one real connection; avoid deleting volumes as routine cleanup.

## Completion

A working local service setup with start/stop, readiness, persistence, and verification notes.
