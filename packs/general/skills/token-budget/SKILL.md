---
name: token-budget
description: "Use when the user wants a token breakdown of visible rules/skills/history and savings suggestions. Never write files. Estimates only."
---

# Token budget
1. Run `scripts/estimate.mjs` if present, else count files you can see.
2. Table: rules, open skills, AGENTS/CLAUDE, chat if available.
3. Suggest: move long procedures to skills, shorten auto descriptions, split references/.
4. Hidden system prompts and billed tokens are out of scope. Label numbers as estimates.
