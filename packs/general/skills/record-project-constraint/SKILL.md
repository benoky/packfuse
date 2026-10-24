---
name: record-project-constraint
description: "Use when the user corrects a code pattern that should apply across the whole repository, or asks to remember a project-wide constraint. Do not use for a single screen or file, a one-off fix, a new skill draft (propose-skill), or repository onboarding (onboard-repo)."
---

# Record project constraint

## Workflow

1. Confirm from the visible conversation that the correction is a repository-wide constraint (for example, a forbidden pattern), not a fix limited to one screen, file, or bug. Hidden prompts and other chats are not evidence.
2. Find the files the installed tools read in the project root: read `.packfuse/state.json` and map `cursor` to `.cursor/rules/project-constraints.mdc` (`alwaysApply: true`), `claude` to `CLAUDE.md`, `codex` to `AGENTS.md`. Without state, use only agent files that already exist; do not guess or create all three.
3. Skip the proposal if any target already states the constraint. Suggest each constraint once per conversation; missing a suggestion is acceptable.
4. Show one short bullet, in the language of the target file, and the exact files it would go into. Wait for the user's approval in this conversation before writing.
5. After approval, add the same bullet to each target. In `CLAUDE.md` and `AGENTS.md`, write outside any `<!-- pack:general:... -->` block. Do not edit Packfuse-owned rule files, `packs/`, or home directories (`~/.cursor`, `~/.claude`, `~/.codex`).
6. If no target exists, ask which file to create and create it only after the user answers.

## Completion

One approved bullet recorded in every target file, or nothing written. Report the files changed. Commit and push follow the Git rule.
