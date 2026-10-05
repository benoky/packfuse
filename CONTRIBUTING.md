# Contributing

Packs live under `packs/<id>/`. Each item is listed in `manifest.json`.

1. Add a rule (`rules/*.md`), skill (`skills/<id>/SKILL.md`), agent, or hook.
2. Register it in the pack manifest (`id`, `kind`, `priority`, `tools`, `invoke`, `requires`, `version`, `source`).
3. Skill `name` must match the folder. Descriptions: what / when / when not, under 500 characters. At most 8 auto P0 skills per pack.
4. `npm test` must pass (dry-run install + snapshot).
5. Prefer an eval task under `evals/` for new automatic skills.

Do not copy vendor skill trees. Wrappers must use a different `name` than the official skill.
