# AGENTS.md template (app repo)

Copy to the app repository root and fill in the parentheses. Commands and paths only. Safety, minimal diffs, and Git limits live in the installed `general` rules — do not repeat them here.

```markdown
# (project name)

One line: (what this service does)

## Commands

- Install: `(e.g. pnpm install)`
- Dev: `(e.g. pnpm dev --port 43123)`
- Test: `(e.g. pnpm test)`
- Typecheck/lint: `(e.g. pnpm typecheck && pnpm lint)`

## Layout

- `(app entry)`
- `(domain / business logic)`
- Generated: `(dist/, .next/, …)`
- Canonical example: `(path to a file others should follow)`

## Packs

List only what is installed. Example: general / general + git + web-ui.

## Skills used often

- Implement: implement-change
- CI: fix-ci
- If the git pack is on: /commit-by-theme, /finishing-a-development-branch
```
