---
name: mcp-builder
description: "Use when the user requests implementing or modifying an MCP server. Do not use for connecting an existing server or generic API work."
---

# MCP builder

## Workflow

1. Confirm intended clients, transports, tool boundaries, and authorization model; consult the current official MCP/SDK documentation.
2. Define narrow input/output schemas, stable errors, pagination, cancellation, and resource limits before side effects.
3. Use the project SDK conventions and [TypeScript](references/ts.md) or [Python](references/python.md) guidance; keep credentials out of prompts and logs.
4. Test schema validation, unauthorized requests, timeouts, and a real client roundtrip. Document transport setup and required environment variables.

## Completion

A server with explicit contracts, bounded side effects, connection instructions, and integration evidence.
