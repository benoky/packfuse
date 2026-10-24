# Discovery notes

Maintainer notes for repository metadata, a terminal demo, and introductions. Nothing here is posted or submitted by adding this file.

npm download counts are registry downloads. They include CI, mirrors, and repeated installs. They are not the number of people using Packfuse.

## GitHub About

Do not apply these from this document automatically.

| Field       | Suggested value                                                                     |
| ----------- | ----------------------------------------------------------------------------------- |
| Description | Install reusable coding skills and rules for Cursor, Claude Code, and Codex.        |
| Website     | https://www.npmjs.com/package/packfuse                                              |
| Topics      | `cursor`, `claude-code`, `codex`, `agent-skills`, `developer-tools`, `coding-agent` |

There is no separate project site. The website field points at the npm page. The npm `homepage` field points at this repository's README.

Topics are chosen because the package installs skills for those tools. Search volume for each topic was not measured.

## Terminal demo

`assets/` contains `logo.png` only. No install GIF is stored.

Record from an empty directory. Use `--dry-run` first so the recording shows the plan, then run the same command without `--dry-run` if you want the files written. Do not record a home install on a machine that already has `~/.packfuse/lock.json`.

```bash
mkdir packfuse-demo && cd packfuse-demo
npx packfuse@latest install --project --tool cursor --dry-run
```

A local build of 1.1.1, run as `node dist/cli.js install --project --tool cursor --dry-run` in an empty temp directory, printed:

```text
cursor: estimated selected always-on tokens≈404 (character approximation, not a model tokenizer; descriptions + unconditional rules; excludes host prompts)
dry-run: no files changed
  write <temp>/.cursor/rules/safety.mdc
  write <temp>/.cursor/rules/verification.mdc
  write <temp>/.cursor/rules/code-change.mdc
  write <temp>/.cursor/rules/git.mdc
  write <temp>/.cursor/skills/implement-change/SKILL.md
  write <temp>/.packfuse/lock.json
```

The middle of the file list is omitted here. Relayed official skills print `npx skills add` instead of `write .../SKILL.md`. Re-run the command after a catalog change before quoting write counts.

After a real install, open that project in Cursor, Claude Code, or Codex and start a new session. Invoke `requesting-code-review` with `/` in Cursor or Claude Code, or with `$` in Codex CLI. That last step depends on the host UI and was not recorded.

A clean `--home --tool claude --dry-run` against an empty profile planned 14 writes, including `~/.claude/CLAUDE.md` and the Packfuse-owned default skills, plus the official skill installer commands. A 1.0.0 home lock can still name `docs:docs-pptx`. `update` drops those retired ids, deletes the files it recorded for them, and runs the official docs installer. Later updates run that installer again while `docs` stays selected.

## Example project

No sample repository is added. One empty directory plus the three `--tool` commands already shows Cursor, Claude Code, and Codex. A sample app would not contain skills until the user runs install, and committing an installed skill tree would copy the catalog.

## Download counts

```bash
npm run downloads
node scripts/npm-downloads.mjs
```

The script calls the public npm downloads API:

- `https://api.npmjs.org/downloads/point/last-week/packfuse`
- `https://api.npmjs.org/downloads/point/last-month/packfuse`
- `https://api.npmjs.org/downloads/range/last-month/packfuse`
- `https://api.npmjs.org/versions/packfuse/last-week`

On 2026-10-17 the API returned 185 downloads for both the last 7 days and the last 30 days, with the 7-day window dated 2026-10-06 through 2026-10-12. The daily series was zero before 2026-10-07. Version counts for that week were 1.1.0: 156 and 1.0.0: 29. 1.1.1 was not in that version response. Re-run the script before quoting newer numbers. The API can lag the current day.

GitHub stars and forks:

```bash
gh repo view benoky/packfuse --json stargazerCount,forkCount
```

Repository traffic is on the GitHub Insights page for people with access. This repository does not collect user identifiers.

Compare a release by noting the publish date in `CHANGELOG.md` and reading the daily rows around that date. That comparison shows downloads, not how many projects kept the install.

## Where an introduction can go

Read each community's current rules before posting. These drafts are not submitted.

### Hacker News

- URL: https://news.ycombinator.com/submit
- Rules: https://news.ycombinator.com/showhn.html and https://news.ycombinator.com/newsguidelines.html
- Fit: a small CLI people can run. Show HN is for something others can try. Blog posts and landing pages are off topic.
- Priority: high, after the README commands match a published npm version.

Title:

```text
Show HN: Packfuse – coding skills for Cursor, Claude Code, and Codex
```

Text:

```text
I made Packfuse, an npm CLI that installs a selected set of coding skills and rules into Cursor, Claude Code, or Codex.

The first install writes four rules and twelve skills (planning, debugging, review, verification, project constraints). It does not install every pack. Agents and hooks are optional and are not in that default set. Cursor also has a plugin listing. Claude Code and Codex use the npm command.

    npx packfuse@latest install --project --tool cursor --dry-run

The same command accepts --tool claude or --tool codex. --home installs for the user account. I am interested in which workflows are actually missing.
```

### Reddit r/cursor

- URL: https://www.reddit.com/r/cursor/
- Weekly thread pattern: search the subreddit for "Weekly Cursor Project Showcase Thread".
- Fit: Cursor users. Moderators remove posts that exceed the self-promotion limit (stated as 10% of activity in removal notices) and showcase posts that do not explain how Cursor is used. The weekly thread asks what you made, how Cursor helped, and disallows commercial or paid links.
- Priority: medium. Prefer the weekly thread, and explain the Cursor install and the skill invocation.

### Reddit r/ClaudeCode and r/ClaudeAI

- URLs: https://www.reddit.com/r/ClaudeCode/ and https://www.reddit.com/r/ClaudeAI/
- Fit: r/ClaudeCode is the closer audience. Confirm the current self-promotion rule on the sidebar before posting. r/ClaudeAI is broader.
- Priority: medium for r/ClaudeCode, low for r/ClaudeAI.

### Cursor forum

- URL: https://forum.cursor.com/c/showcase/9
- Fit: Cursor plugins and workflows. Marketplace submission itself stays at https://cursor.com/marketplace/publish and is separate from a forum post.
- Priority: medium.

### OpenAI developer community

- URL: https://community.openai.com/c/codex/codex-cli/39
- Fit: Codex CLI users. Read the category notice before posting an install tool.
- Priority: medium.

### Awesome lists

- https://github.com/hesreallyhim/awesome-claude-code/issues/new?template=recommend-resource.yml
    - Use the web form. Do not open a pull request. A maintainer note from 2026-02-11 says whole marketplaces, repositories younger than a week, and resources that are only "compatible with Claude Code" are out of scope, and a bundle should not be submitted as if it were one item. Packfuse may be rejected. Priority: low until that note is re-read.
- https://github.com/RoggeOhta/awesome-codex-cli
    - The list has a Skills section and says contributions go through its contributing guidelines. Priority: medium if the guidelines still accept skill installers.
- https://github.com/PatrickJS/awesome-cursorrules
    - This list is curated `.mdc` rule files, not installers. A Packfuse entry is a poor fit. Priority: skip.

### Draft for a Cursor or Claude Code post

```text
Packfuse installs a small default set of coding skills and rules, then lets you add a pack or one skill.

Cursor:
npx packfuse@latest install --project --tool cursor

Claude Code:
npx packfuse@latest install --project --tool claude

The default set is four rules and twelve skills. It includes systematic-debugging, requesting-code-review, and record-project-constraint. It does not install agents, hooks, or every pack. --dry-run prints the files it would write.

Repo: https://github.com/benoky/packfuse
```

### Korean draft

```text
Packfuse는 Cursor, Claude Code, Codex에 코딩 스킬과 규칙을 넣는 CLI입니다.

npx packfuse@latest install --project --tool cursor

처음 설치는 general P0(규칙 4개, 스킬 12개)입니다. 모든 팩을 한 번에 설치하지 않습니다. 에이전트와 훅은 기본 설치에 없습니다. --dry-run으로 쓰기 전에 목록을 볼 수 있습니다.

https://github.com/benoky/packfuse
```

## What is likely to matter later

- npm keywords now name the three tools. Whether that changes search ranking was not measured.
- An official docs page or another tool's catalog would be a better referral than adding Packfuse as a dependency of unrelated packages.
- A starter kit should document the install command. It should not vendor the skill files.
- Cursor marketplace publication is still a manual submission at https://cursor.com/marketplace/publish. This pass does not submit it.
- `dist/` is gitignored. `prepack` runs the TypeScript build so `npm pack` and `npm publish` include `dist/cli.js`.
