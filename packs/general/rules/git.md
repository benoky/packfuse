---
description: Commit when asked or when an approved plan step includes it; push and PRs only for a requested finish
alwaysApply: true
---

- Commit only when this conversation asked, or when a user-approved plan or explicitly invoked skill includes a commit step.
- Push, open or merge a pull request, tag, or publish only when this conversation asked for that action or the user invoked a finish or release skill for it.
- Do not force-push, skip hooks, rewrite published history, or push to a shared branch the user did not name, unless this conversation explicitly authorized that operation.
