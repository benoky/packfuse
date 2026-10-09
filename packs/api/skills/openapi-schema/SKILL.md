---
name: openapi-schema
description: "Use when OpenAPI or JSON Schema is the authoritative contract being maintained. Do not use for API behavior still undecided or changes unrelated to a schema."
---

# OpenAPI schema

## Workflow

1. Locate the canonical schema and generator/validator versions; avoid editing generated output.
2. Update types, required fields, formats, examples, error responses, and security declarations together.
3. Validate the schema and regenerate consumers using existing commands. Review compatibility changes in generated diffs.
4. Run request/response contract checks and verify examples against the schema.

## Completion

A valid source schema with regenerated artifacts and evidence that implementation and clients agree.
