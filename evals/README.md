# Reproducible skill evaluation

This harness prepares seven small tasks and grades their observable outputs. It does **not** run a model, fabricate token counts, or prove skill effectiveness.

| Task | Behavioral check |
| --- | --- |
| ci-fix | Numeric function passes positive, negative, and zero inputs |
| bugfix | Empty and nonempty averages preserve their contract |
| merge-conflict | Both intended exports work after resolving markers |
| small-feature | New optional argument works and old calls remain compatible |
| api-contract | Boundary validation and stable error shape |
| web-ui | Static label/input/button semantics; not a browser or WCAG audit |
| authorization | Anonymous and other-owner access denied, owner/admin allowed |

```bash
npm run build
npm run eval -- --self-test
npm run eval -- --prepare --out ./eval-runs/baseline --mode baseline --tool cursor --model YOUR_MODEL --repeats 3
npm run eval -- --prepare --out ./eval-runs/general --mode general --tool cursor --model YOUR_MODEL --repeats 3
# Optional: general plus the relevant api/web-ui/security pack
npm run eval -- --prepare --out ./eval-runs/domain --mode domain --tool cursor --model YOUR_MODEL --repeats 3
```

Run the same model/settings once per prepared `work/PROMPT.md` in fresh sessions. Restrict the agent's workspace to that run's `work` directory so evaluator source and reference repairs are not visible. Keep starting conditions equivalent. Use a disposable environment without home-level rules/skills; the harness does not disable personal configuration for you. Slash-only skills need the same explicit invocation policy recorded for every applicable run.

Record transcript location, actual reported tokens, observed test-first behavior, and verification in the sibling `evidence.json`. Leave unknown values `null`; never infer them from a passing final test. Do not put credentials or private transcripts into a public report.

```bash
npm run eval -- --grade --out ./eval-runs/baseline
npm run eval -- --grade --out ./eval-runs/general
```

Grading writes `results.json` and `report.md`; any failed behavioral check exits nonzero. A pass requires both exit status zero and a dedicated completion signal emitted after all assertions. A submission that exits early is recorded with `completed: false` and cannot pass. This completion check detects premature termination; it does not turn local execution into a tamper-proof sandbox. Changed-file count excludes installed pack configuration. It is not a line-based minimal-diff score. Process evidence remains self-reported and requires transcript review. Three trials are a small reproducible comparison, not statistical proof.

`--self-test` checks that every broken fixture fails and its reference repair passes. These are grader tests, **not model evaluation results**. Original repositories, accounts, Git history, and external services are never modified by this harness. Generated submissions run as local code; use the same isolation you use for ordinary project tests.
