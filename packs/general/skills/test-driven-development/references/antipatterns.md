# Test antipatterns

- A test added after the fix without an observed initial failure is not evidence of a red/green cycle.
- Do not mock the unit being verified or assert only that the implementation called itself.
- Do not accept a syntax/setup failure as the intended regression failure.
- Avoid sleeps, real external services, and ordering dependencies when a controlled fixture can model the boundary.
- Assert observable behavior and relevant errors, not incidental private names or formatting.
- Preserve failing evidence; do not weaken assertions, skip tests, or reset snapshots merely to get green.
