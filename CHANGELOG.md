# Changelog

## 1.2.0

Official Superpowers, Anthropic, Vercel, and Figma skills install through `npx skills add` instead of Packfuse copies. `implement-change` and other Packfuse-owned items stay local. `uninstall` removes official names that Packfuse recorded as owned, for pack relays and item relays, and leaves skills that were already present. Locks without ownership records still only drop the pack relay from the lock.

A 1.0.0 lock that still names `docs-pdf`, `docs-docx`, `docs-pptx`, or `docs-xlsx` no longer stops `update`. Those ids are removed, and `update` runs the official installer again while `docs` stays selected.

The always-on `git` rule allows commits that a user-approved plan or explicitly invoked skill includes, and still requires an explicit finish request for push, pull requests, tags, and publishes. Force-push, skipped hooks, history rewrites, and unnamed shared-branch pushes stay forbidden without explicit authorization.

The `code-change` rule rejects a dependency, wrapper, or abstraction the user did not ask for.

A first installation of `general` includes `record-project-constraint`. It writes one approved repository-wide constraint into the installed tool's instruction file. `update` refreshes items that are already installed and does not add this skill to an older installation.

There is no per-pack cap on automatic P0 skills.

The Cursor plugin manifest, its hooks file, and the marketplace installation instructions were removed. Cursor, Claude Code, and Codex all install through the npm CLI.

The package, CLI, and pack item versions are 1.2.0.

## 1.1.1

A first installation of `general` writes four rules: `safety`, `verification`, `code-change`, and `git`. `requirements` and `skill-promotion` install with `--priority p1`.

`query-and-index` does not recommend an index until the execution plan shows the access path.

This repository is the Cursor plugin. `.cursor-plugin/plugin.json` includes the bundled skills, rules, agents, and hooks. The plugin marketplace is supported for Cursor only. Claude Code and Codex install with npm.

Token estimates no longer use `js-tiktoken`. The package, CLI, and pack item versions are 1.1.1.

## 1.1.0

Installs apply through a file transaction and roll back if a write fails. Manifests are validated before they are applied. An update refreshes an installed item when its version changes, and it does not copy that pack into another tool.

The `docs` pack no longer ships empty document skills. Selecting it runs the official Anthropic installer for `pdf`, `docx`, `pptx`, and `xlsx`. A dry run prints that command and does not execute it. Uninstalling the pack does not remove those official skills.

Skill instructions were rewritten with clearer steps and headings. The README explains pack selection, that the same packs install into Cursor, Claude Code, or Codex, and includes a table of contents in each language.

The package, CLI, and pack item versions are 1.1.0. Node.js 20.6 or later is required.
