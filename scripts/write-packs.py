#!/usr/bin/env python3
"""One-shot pack file writer for packfuse."""
from pathlib import Path
import json

ROOT = Path("/workspace/packs")
TOOLS = ["cursor", "claude", "codex"]
V = "1.1.0"

def skill(pack, sid, desc, body, invoke="auto", p="p0", requires=None, extras=None, source="self"):
    d = ROOT / pack / "skills" / sid
    d.mkdir(parents=True, exist_ok=True)
    (d / "SKILL.md").write_text(f"---\nname: {sid}\ndescription: {json.dumps(desc)}\n---\n\n{body.strip()}\n", encoding="utf-8")
    if extras:
        for rel, content in extras.items():
            pth = d / rel
            pth.parent.mkdir(parents=True, exist_ok=True)
            pth.write_text(content, encoding="utf-8")
    return {
        "id": sid, "kind": "skill", "priority": p, "tools": TOOLS, "invoke": invoke,
        "requires": requires or [], "version": V, "source": source,
    }

def rule(pack, rid, desc, body, p="p0"):
    d = ROOT / pack / "rules"
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{rid}.md").write_text(f"---\ndescription: {desc}\nalwaysApply: true\n---\n\n{body.strip()}\n", encoding="utf-8")
    return {"id": rid, "kind": "rule", "priority": p, "tools": TOOLS, "version": V, "source": "self"}

def agent(pack, aid, desc, body, p="p1"):
    d = ROOT / pack / "agents"
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{aid}.md").write_text(f"---\nname: {aid}\ndescription: {json.dumps(desc)}\n---\n\n{body.strip()}\n", encoding="utf-8")
    return {"id": aid, "kind": "agent", "priority": p, "tools": TOOLS, "version": V, "source": "self"}

def hook(pack, hid, script, p="p1", tools=None):
    d = ROOT / pack / "hooks" / hid
    d.mkdir(parents=True, exist_ok=True)
    (d / "run.mjs").write_text(script.strip() + "\n", encoding="utf-8")
    return {"id": hid, "kind": "hook", "priority": p, "tools": tools or ["cursor", "claude"], "version": V, "source": "self"}

def pack(pid, items):
    d = ROOT / pid
    d.mkdir(parents=True, exist_ok=True)
    (d / "manifest.json").write_text(json.dumps({"id": pid, "version": V, "items": items}, indent=2) + "\n", encoding="utf-8")

# --- general ---
g = []
g.append(rule("general", "requirements", "Do not skip stated requirements; object before implementing a bad plan", """
- Implement every stated requirement. If a request is inefficient or wrong, object before coding.
- Do not invent product scope the user did not ask for.
"""))
g.append(rule("general", "safety", "Secrets and destructive commands", """
- Never commit secrets. Keep them in env files and secret managers.
- Do not run destructive disk or force-push commands unless the user asked in this conversation.
"""))
g.append(rule("general", "verification", "Verify with tests or real UI behavior", """
- Run the relevant tests or typecheck for the change.
- If the change is user-visible UI, verify the flow, not only a screenshot.
"""))
g.append(rule("general", "code-change", "Minimal diffs; do not edit generated output", """
- Prefer the smallest diff that matches existing patterns.
- Do not edit generated folders (dist, .next, build, coverage).
"""))
g.append(rule("general", "git", "Commit, push, and PRs only when asked", """
- Do not commit, push, or open a pull request unless the user asked in this conversation.
"""))
g.append(rule("general", "skill-promotion", "Suggest promoting a repeated procedure once", """
- If the user re-requests the same procedure about three times, suggest a skill or rule once.
- Do not suggest mid-implementation. Do not write skill files unless asked. Missing a suggestion is fine.
"""))

g.append(skill("general", "brainstorming", "Use when a new feature or design is unclear. Ask questions and compare options before coding. Do not use for typos or single-file fixes.", """
# Brainstorming
1. Restate the goal in one sentence.
2. Ask only the questions that change the design.
3. Give 2–3 options with tradeoffs.
4. Wait for confirmation before `writing-plans` or `implement-change`.
""", invoke="auto", source="obra/superpowers brainstorming (procedure)"))
g.append(skill("general", "writing-plans", "Use when turning an agreed design into small, verifiable tasks. Do not use for a one-line fix.", """
# Writing plans
Split work into tasks that each have: files to touch, a test or check, and a done definition.
Keep tasks independently reviewable. Do not start implementation in this skill.
""", invoke="auto", extras={"references/task-template.md": "# Task\n- Goal:\n- Files:\n- Check:\n"}, source="obra/superpowers writing-plans (procedure)"))
g.append(skill("general", "implement-change", "Use for a concrete code change: explore, minimal edit, verify. Do not use when the design is still open.", """
# Implement change
1. Find the existing pattern; follow it.
2. Change only what the task needs.
3. Run the targeted tests or checks.
4. Stop. Do not commit unless asked.
""", invoke="auto"))
g.append(skill("general", "test-driven-development", "Use when a failing test should exist first (known expected behavior). Do not use when you still need to discover the cause.", """
# TDD
1. Write one failing test that names the bug or behavior.
2. Run it; confirm fail.
3. Write the smallest code to pass.
4. Re-run. No extra refactor unless asked.
""", invoke="auto", extras={"references/antipatterns.md": "- Do not write tests after a lucky pass and call it TDD.\n- Do not mock the unit under test.\n"}, source="obra/superpowers test-driven-development (procedure)"))
g.append(skill("general", "systematic-debugging", "Use when behavior is wrong and the cause is unknown. Do not use if a failing test already specifies the fix.", """
# Systematic debugging
1. Reproduce with a command or test.
2. State a hypothesis.
3. Change one thing.
4. Re-verify the reproduction. Keep a short log of what you ruled out.
""", invoke="auto", source="obra/superpowers systematic-debugging (procedure)"))
g.append(skill("general", "fix-ci", "Use when CI/checks failed. Touch only failing jobs and use logs as evidence.", """
# Fix CI
1. Read the failing job logs, not just the check name.
2. Reproduce locally if possible.
3. Fix the failing check only. Do not drive-by lint unrelated files.
"""))
g.append(skill("general", "verification-before-completion", "Use before saying a task is done. Run tests and, for UI, exercise the flow.", """
# Verification before completion
- Run the project test/lint commands that cover the change.
- For UI, click through the path a user would take.
- Report what you ran and the result.
""", invoke="auto", source="obra/superpowers verification-before-completion (procedure)"))
g.append(skill("general", "resolve-merge-conflicts", "Use when git merge/rebase conflicts block finishing a change. Keep both sides' intent.", """
# Merge conflicts
1. Read both sides. Keep behavior, not just one hunk.
2. Re-run tests.
3. Do not delete conflict markers without resolving.
"""))
g.append(skill("general", "requesting-code-review", "Use when the user asks for a review. Focus on bugs, regressions, and contract breaks. Do not use for casual nits while implementing.", """
# Requesting code review
Review for: correctness, regressions, API/contract breaks, missing tests.
List findings. Do not rewrite the change unless asked.
Share the same checklist as the reviewer agent.
""", invoke="slash", extras={"references/checklist.md": "- Bugs and regressions\n- Contract / API breaks\n- Missing tests\n- Secrets\n"}, source="obra/superpowers requesting-code-review (procedure)"))
g.append(skill("general", "propose-skill", "Use when the user wants a skill/rule draft from a repeated procedure, or after the promotion rule fires. Never write files.", """
# Propose skill
Output: name, when to use, when not, steps, whether it should be slash-only.
Do not write SKILL.md unless the user asks after seeing the draft.
""", invoke="slash", extras={"references/promotion-criteria.md": "- Same procedure restated ~3 times\n- Stable steps\n- Not a one-off\n"}))
g.append(skill("general", "blast-radius", "Use when the user wants to know what a small diff can break. Slash only.", """
# Blast radius
List callers, fixtures, generated types, and user flows that could break.
Prefer grep and tests over speculation.
""", invoke="slash"))
g.append(skill("general", "safe-refactor", "Use when refactoring with no behavior change. Keep tests green at each step.", """
# Safe refactor
No feature work. Rename/extract only with tests before and after.
""", invoke="auto", p="p1"))
g.append(skill("general", "receiving-code-review", "Use when applying review comments. Address each item or explain why not.", """
# Receiving review
For each comment: fix, or reply with evidence. Do not silently skip.
""", invoke="slash", p="p1", source="obra/superpowers receiving-code-review (procedure)"))
g.append(skill("general", "docs-from-code", "Use when writing docs. Treat code as source of truth.", """
# Docs from code
Read the implementation. Do not invent APIs. Mark unknowns.
""", invoke="slash", p="p1"))
g.append(skill("general", "onboard-repo", "Use when drafting AGENTS.md for this repo. Commands and paths only.", """
# Onboard repo
Propose AGENTS.md: install, dev, test, lint, layout. Do not copy general safety rules.
""", invoke="slash", p="p1"))
g.append(skill("general", "token-budget", "Use when the user wants a token breakdown of visible rules/skills/history and savings suggestions. Never write files. Estimates only.", """
# Token budget
1. Run `scripts/estimate.mjs` if present, else count files you can see.
2. Table: rules, open skills, AGENTS/CLAUDE, chat if available.
3. Suggest: move long procedures to skills, shorten auto descriptions, split references/.
4. Hidden system prompts and billed tokens are out of scope. Label numbers as estimates.
""", invoke="slash", p="p1", extras={"scripts/estimate.mjs": "import { readFileSync, existsSync } from 'node:fs';\nimport { encodingForModel } from 'js-tiktoken';\nconst enc = encodingForModel('gpt-4');\nconst files = process.argv.slice(2);\nlet t = 0;\nfor (const f of files) {\n  if (!existsSync(f)) continue;\n  const n = enc.encode(readFileSync(f, 'utf8')).length;\n  t += n;\n  console.log(n, f);\n}\nconsole.log('total', t);\n"}))
g.append(skill("general", "handoff", "Use when starting a new chat with a short handoff. Goal, decisions, files, next task, constraints. No raw transcript.", """
# Handoff
Output a paste-ready note:
- Goal
- Decisions already made
- Files touched
- Next single task
- Constraints
Omit discarded options and exploration.
""", invoke="slash", p="p1"))
g.append(skill("general", "update-deps", "Use when bumping dependencies one at a time with tests.", """
# Update deps
Bump one dependency, run tests, then the next. Do not batch unrelated majors.
""", invoke="slash", p="p1"))
g.append(skill("general", "author-ci", "Use when adding CI for this repo's runner. Match existing workflows.", """
# Author CI
Add the smallest workflow that runs the repo's test/lint commands.
""", invoke="slash", p="p1"))
g.append(skill("general", "flaky-test", "Use when a test is flaky. Reproduce, isolate, then fix or quarantine with evidence.", """
# Flaky test
Reproduce with repeats. Isolate timing/order. Fix or skip with a ticket, do not ignore.
""", invoke="auto", p="p1"))
g.append(skill("general", "reproduce-minimal", "Use when shrinking a bug to a minimal reproduction.", """
# Minimal reproduction
Strip unrelated files until the bug still happens. Record the command.
""", invoke="slash", p="p1"))
g.append(skill("general", "explain-codebase", "Use when mapping modules deeper than onboard-repo.", """
# Explain codebase
Map entrypoints, domain folders, and data flow. Cite paths.
""", invoke="slash", p="p1"))
g.append(skill("general", "subagent-driven-development", "Use only when a plan has many independent tasks. Spawn a fresh implementer per task, then review. Do not implement everything in the main thread.", """
# Subagent-driven development
For each plan task: new implementer subagent, then reviewer using the reviewer agent prompt.
Do not pollute the parent context with implementation dumps.
""", invoke="slash", p="p2", requires=["general:reviewer", "general:writing-plans"], source="obra/superpowers subagent-driven-development (procedure)"))
g.append(skill("general", "adr", "Use when recording an architecture decision.", """
# ADR
Write context, decision, consequences. One decision per file.
""", invoke="slash", p="p2", extras={"references/template.md": "# Title\n## Context\n## Decision\n## Consequences\n"}))
g.append(skill("general", "incident-lite", "Use for a short incident note: symptom, impact, rollback.", """
# Incident lite
Symptom, blast radius, rollback yes/no, next check. No blame.
""", invoke="slash", p="p2"))

g.append(agent("general", "code-explorer", "Read-only codebase exploration. Prefer this when a dedicated explore pass should not edit files.", """
Explore with read/search only. Return paths and a short map. Do not edit.
"""))
g.append(agent("general", "reviewer", "Independent defect list: bugs, regressions, contracts. No style nits unless they hide bugs.", """
Return a defect list. Severity first. Use references/checklist.md from requesting-code-review when present.
"""))
g.append(agent("general", "verifier", "Run tests, builds, and UI checks. Report commands and outcomes.", """
Run the repo's test/build. For UI, exercise the flow. Report pass/fail with commands.
"""))

g.append(hook("general", "afterFileEdit", '''
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
const cwd = process.env.CURSOR_PROJECT_DIR || process.cwd();
for (const cmd of [["npx", "prettier", "--write", "."], ["npx", "eslint", "--fix", "."]]) {
  // no-op placeholder: formatters run only if project scripts exist
}
const pkg = cwd + "/package.json";
if (existsSync(pkg)) {
  // prefer project format script if present
}
process.exit(0);
''', p="p1"))
g.append(hook("general", "beforeShellExecution", '''
const fs = await import("node:fs");
let input = "";
if (process.stdin.isTTY) process.exit(0);
for await (const chunk of process.stdin) input += chunk;
let cmd = input;
try { cmd = JSON.stringify(JSON.parse(input)); } catch {}
const deny = [/git\\s+push\\s+.*--force/, /rm\\s+-rf\\s+\\/( |$)/, /mkfs\\./];
if (deny.some((r) => r.test(cmd))) {
  console.error("packfuse: blocked destructive command");
  process.exit(2);
}
process.exit(0);
''', p="p1", tools=["cursor", "claude"]))
g.append(hook("general", "sessionEnd", '''
console.log("If you repeated a procedure this session, run /propose-skill.");
process.exit(0);
''', p="p2", tools=["cursor"]))

pack("general", g)

# git
git_items = []
git_items.append(skill("git", "commit-by-theme", "Use when the user asked to commit. Split by theme. Do not commit unless asked.", """
# Commit by theme
Stage related files per theme. Subject from the diff. Body: bullet list with -.
Do not push unless asked.
""", invoke="slash"))
git_items.append(skill("git", "finishing-a-development-branch", "Use when the user asked to finish a branch: test, then merge or PR, then cleanup.", """
# Finish branch
Run tests. Open or update PR if asked. Do not force-push protected branches.
""", invoke="slash", source="obra/superpowers finishing-a-development-branch (procedure)"))
git_items.append(skill("git", "git-bisect", "Use to find the commit that introduced a regression.", """
# Bisect
Automate git bisect with a test command. Stop at first bad commit and summarize.
""", invoke="slash", p="p1"))
git_items.append(skill("git", "using-git-worktrees", "Use when isolating a branch in a worktree.", """
# Worktrees
Create a sibling worktree. Do not copy node_modules; install in the worktree.
""", invoke="slash", p="p1", source="obra/superpowers using-git-worktrees (procedure)"))
git_items.append(skill("git", "cut-release", "Use for version bump, changelog, and tag. No deploy credentials.", """
# Cut release
Bump version, changelog, tag. Do not publish to registries unless asked.
""", invoke="slash", p="p1"))
pack("git", git_items)

# api
api = []
api.append(skill("api", "api-design", "Use when designing HTTP/RPC APIs: boundaries, errors, compatibility.", """
# API design
Stable error shape, pagination, auth boundary. No breaking field reuse.
"""))
api.append(skill("api", "openapi-schema", "Use when OpenAPI/JSON Schema is the source of truth.", """
# OpenAPI
Edit the schema first, then generate or update handlers. Do not drift docs.
""", invoke="slash", p="p1"))
api.append(skill("api", "db-migration", "Use when writing database migrations. Require down/up, no in-place type changes.", """
# DB migration
Expand/contract. Backfill separately. Never drop+add a column in one unsafe step.
"""))
api.append(skill("api", "query-and-index", "Use for query performance: N+1, indexes, transactions.", """
# Query and index
Find N+1, missing indexes, long transactions. Measure if possible.
""", invoke="auto", p="p1"))
pack("api", api)

# web-ui
web = []
web.append(skill("web-ui", "frontend-design", "Use for web UI implementation. Avoid generic AI aesthetics; match the product.", """
# Frontend design
Use the project's tokens and components. Distinct typography and spacing. No purple-on-white cliché unless the brand is that.
""", source="anthropics/skills frontend-design (procedure)"))
web.append(skill("web-ui", "webapp-testing", "Use to verify a local web app in a real browser. Pick one stack (Playwright-class). Slash only.", """
# Webapp testing
Start the app if needed. Exercise the user flow. One browser tool family only.
""", invoke="slash", source="anthropics/skills webapp-testing (procedure)"))
web.append(skill("web-ui", "web-design-guidelines", "Wrapper: prefer the official Vercel web-design-guidelines skill if installed.", """
# Web design guidelines
If the official Vercel skill is missing, audit contrast, focus, keyboard, and form labels only.
""", invoke="slash", p="p1", source="vercel-labs/agent-skills (wrapper)"))
pack("web-ui", web)

# react
react = [skill("react", "react-best-practices", "Wrapper for Vercel React/Next best practices. Prefer the official pack; do not copy vendor text.", """
# React best practices
If `vercel-react-best-practices` is not installed, tell the user to install the official Vercel skill.
Otherwise follow that pack. Waterfall fetches, bundle size, and server/client split.
""", invoke="auto", source="vercel-labs/agent-skills (wrapper)")]
react[-1]["vendor"] = "npx skills add vercel-labs/agent-skills"
pack("react", react)

# figma
fig = [skill("figma", "figma-design-to-code", "Wrapper for official Figma design-to-code. No secrets in this skill.", """
# Figma to code
Ask the user to connect Figma MCP in their tool. Then: structure, tokens, then components. Do not invent a design system.
""", invoke="slash", source="Figma official (wrapper)")]
pack("figma", fig)

# local-runtime
loc = []
loc.append(skill("local-runtime", "dev-containers", "Use when setting up a reproducible local container environment.", """
# Dev containers
Devcontainer.json, one command to up. Do not commit host-only paths.
""", invoke="slash", p="p1"))
loc.append(skill("local-runtime", "docker-compose-dev", "Use for local compose services.", """
# Compose
Service names, ports, volumes. Healthchecks. No production secrets in compose committed files.
""", invoke="slash", p="p1"))
pack("local-runtime", loc)

# security
sec = [skill("security", "security-pass", "Use for an auth/secrets/injection pass. No exploit steps.", """
# Security pass
Check authz on new endpoints, secret handling, injection in queries/HTML. Report only. No payloads.
""", invoke="slash", extras={"references/checklist.md": "- Authn/z\n- Secrets\n- Injection\n- CSRF/CORS\n"})]
pack("security", sec)

# tools
tools_p = [skill("tools", "mcp-builder", "Use only when building an MCP server.", """
# MCP builder
Define tools with tight schemas. Validate input. No secret logging.
""", invoke="slash", p="p1", extras={"references/ts.md": "Prefer SDK types and explicit tool names.\n", "references/python.md": "Validate with typed models before side effects.\n"}, source="anthropics/skills mcp-builder (procedure)")]
pack("tools", tools_p)

docs = ROOT / "docs"
docs.mkdir(parents=True, exist_ok=True)
(docs / "manifest.json").write_text(json.dumps({
    "id": "docs", "version": V, "items": [],
    "relay": {"source": "https://github.com/anthropics/skills", "skills": ["pdf", "docx", "pptx", "xlsx"]},
}, indent=2) + "\n", encoding="utf-8")

(ROOT / "index.json").write_text(json.dumps({"packs": ["general", "git", "web-ui", "react", "figma", "api", "local-runtime", "security", "tools", "docs"]}, indent=2) + "\n", encoding="utf-8")
print("wrote packs")
