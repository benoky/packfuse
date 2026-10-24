# Contributing

Packs live under `packs/<id>/`. Each item is listed in `manifest.json`.

1. Add a rule (`rules/*.md`), skill (`skills/<id>/SKILL.md`), agent, or hook.
2. Register it in the pack manifest (`id`, `kind`, `priority`, `tools`, `invoke`, `requires`, `version`, `source`).
3. Skill `name` must match the folder. Descriptions: what / when / when not, under 500 characters.
4. `npm test` must pass (dry-run install + snapshot).
5. Prefer an eval task under `evals/` for new automatic skills.

Do not copy vendor skill trees. If an official skill exists, add `"relay": { "source": "owner/repo", "skill": "optional-name" }` on the item and omit the local skill directory. Packfuse then runs `npx skills add` / `remove`. Keep a local `SKILL.md` only for Packfuse-owned items.
