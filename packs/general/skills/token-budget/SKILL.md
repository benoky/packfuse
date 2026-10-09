---
name: token-budget
description: "Use when the user requests a token estimate for visible rules, skills, or supplied history. Do not use for billing reconciliation, hidden context inspection, or unrelated optimization."
---

# Token budget

## Workflow

1. List only visible files or text in scope. Distinguish always-on rules, automatic descriptions, and explicitly opened skill bodies.
2. Run [the estimator](scripts/estimate.mjs) with explicit file paths. If js-tiktoken is unavailable, report its clearly labeled character-based approximation.
3. Present per-file totals and avoid counting the same text twice. Record the tokenizer or approximation used.
4. Suggest targeted reductions: move procedures into on-demand references and remove redundant wording. Do not edit without a request.

## Completion

An estimate table and prioritized savings suggestions, excluding hidden prompts and actual billed-token claims.
