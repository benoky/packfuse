---
name: api-design
description: "Use when designing or changing an HTTP/RPC contract. Do not use for database-only changes, UI-only work, or schema-first maintenance (openapi-schema)."
---

# API design

## Workflow

1. Read existing API conventions and consumers. Define actors, authorization boundaries, and success/error behavior.
2. Specify request/response shapes, validation, stable errors, pagination, and idempotency when applicable.
3. Check backward compatibility and rollout order with existing clients; avoid reusing a field with a new meaning.
4. Add contract tests for normal, invalid, unauthorized, and boundary requests; update the authoritative API document.

## Completion

A concrete contract with examples, compatibility decisions, and verification tied to consumer behavior.
