# Defensive review checklist

| Boundary | Check | Safe evidence |
| --- | --- | --- |
| Identity | Authentication and session validation | Anonymous and expired-session local tests |
| Authorization | Object ownership and tenant boundary on every access | Synthetic users accessing their own versus another fixture |
| Input | Validation before query, HTML, path, or process use | Invalid-value and boundary tests in an isolated fixture |
| Secrets | No secrets in source, logs, errors, or artifacts | Configuration and logging inspection with redacted samples |
| Browser | Output encoding, CSRF handling, justified CORS policy | Framework configuration and benign local tests |
| State | Atomic changes, idempotency, bounded retries | Failure-path and concurrent-request tests |

Report concrete paths and consequences. This checklist does not establish regulatory compliance or comprehensive security assurance.
