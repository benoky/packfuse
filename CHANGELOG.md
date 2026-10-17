# Changelog

## 1.1.1

A first installation of `general` writes four rules: `safety`, `verification`, `code-change`, and `git`. `requirements` and `skill-promotion` install with `--priority p1`.

`query-and-index` does not recommend an index until the execution plan shows the access path.

This repository is the Cursor plugin. `.cursor-plugin/plugin.json` includes the bundled skills, rules, agents, and hooks. ChatGPT and Codex use the skills-only archive from `npm run pack:codex`. Claude Code marketplace installation is not supported yet.

Token estimates no longer use `js-tiktoken`. The package, CLI, and pack item versions are 1.1.1.

## 1.1.0

Installs apply through a file transaction and roll back if a write fails. Manifests are validated before they are applied. An update refreshes an installed item when its version changes, and it does not copy that pack into another tool.

The `docs` pack no longer ships empty document skills. Selecting it runs the official Anthropic installer for `pdf`, `docx`, `pptx`, and `xlsx`. A dry run prints that command and does not execute it. Uninstalling the pack does not remove those official skills.

Skill instructions were rewritten with clearer steps and headings. The README explains pack selection, that the same packs install into Cursor, Claude Code, or Codex, and includes a table of contents in each language.

The package, CLI, and pack item versions are 1.1.0. Node.js 20.6 or later is required.
