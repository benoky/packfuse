# Evals

Reproducible comparison, not a proof of quality.

| Task | Pass if |
| --- | --- |
| `ci-fix` | Only failing checks change; tests pass |
| `bugfix` | Failing test added first; bug gone |
| `merge-conflict` | Both intents kept; tests pass |
| `small-feature` | Minimal diff; verification ran |

Run each task 3 times, one model, with no packs vs `packfuse install --project --tool <tool>` (`general` P0).

```bash
npm run eval
```

Publish the table with model and date.
