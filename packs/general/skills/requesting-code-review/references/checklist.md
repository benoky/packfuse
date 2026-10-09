# Evidence-based review

- Correctness: boundary values, state transitions, async ordering, cleanup, retries, and error propagation.
- Compatibility: API fields, CLI flags, persisted state, migrations, and older clients.
- Ownership: preserve unrelated files/settings; delete only artifacts owned by the operation.
- Security: object-level authorization, input validation, secret handling, and trust boundaries.
- Verification: a regression check that would fail before the change; real behavior rather than mocks of the implementation.

For each finding report severity, path/symbol, triggering condition, consequence, and a check. Avoid speculation, unrelated refactors, and formatting nits. State review scope and unverified assumptions.
