import test from "node:test";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { removeMarked, upsertMarked } from "./convert.js";
import assert from "node:assert/strict";
import {
    mkdtempSync,
    rmSync,
    existsSync,
    readdirSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { install, uninstall, update, doctor, resolveScope, relayArgv } from "./engine.js";
import { toolPaths } from "./paths.js";
import { validateCatalog } from "./validate.js";
import { resolveRequires, allItems } from "./manifest.js";
import { FileTransaction } from "./transaction.js";

const read = (p: string) => readFileSync(p, "utf8");
const json = (p: string) => JSON.parse(read(p));
const put = (p: string, v: string) => {
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, v);
};
function tree(dir: string, root = dir): Record<string, string> {
    if (!existsSync(dir)) return {};
    return Object.assign(
        {},
        ...readdirSync(dir, { withFileTypes: true }).map((e) => {
            const f = path.join(dir, e.name);
            return e.isDirectory() ? tree(f, root) : { [path.relative(root, f)]: read(f) };
        }),
    );
}
async function capture(fn: () => Promise<void>) {
    const lines: string[] = [];
    const log = console.log;
    console.log = (...args) => lines.push(args.join(" "));
    try {
        await fn();
        return lines.join("\n");
    } finally {
        console.log = log;
    }
}

test("packfuse regression suite", async (t) => {
    const temp = mkdtempSync(path.join(os.tmpdir(), "packfuse tests "));
    const home = path.join(temp, "home");
    mkdirSync(home);
    t.mock.method(os, "homedir", () => home);
    const cwd = (name: string) => {
        const p = path.join(temp, name);
        mkdirSync(p);
        return p;
    };
    try {
        await t.test("catalog and dependency cycle validation", () => {
            assert.deepEqual(validateCatalog(), []);
            const all = structuredClone(allItems());
            all[0].item.requires = [`${all[0].pack}:${all[0].item.id}`];
            assert.throws(() => resolveRequires([all[0]], all), /Circular/);
        });
        for (const tool of ["cursor", "claude", "codex"] as const)
            for (const scope of ["project", "home"] as const) {
                await t.test(
                    `${tool}/${scope}: dry-run, install, idempotency, update, uninstall`,
                    async () => {
                        const root = cwd(`${tool}-${scope}`);
                        const opts = { scope, tool, cwd: root };
                        const before = tree(temp);
                        const dry = await capture(() => install({ ...opts, dryRun: true }));
                        assert.match(dry, /SKILL.md/);
                        assert.deepEqual(tree(temp), before);
                        await capture(() => install(opts));
                        const p = toolPaths(tool, scope, root);
                        assert.ok(existsSync(path.join(p.skills, "implement-change", "SKILL.md")));
                        if (tool === "codex")
                            assert.match(
                                read(path.join(p.skills, "blast-radius", "agents", "openai.yaml")),
                                /allow_implicit_invocation: false/,
                            );
                        if (tool === "claude" || tool === "codex")
                            assert.equal(
                                (read(p.ruleFile!).match(/<!-- pack:general:/g) ?? []).length,
                                6,
                            );
                        const installed = tree(temp);
                        await capture(() => install(opts));
                        assert.deepEqual(tree(temp), installed);
                        const unchanged = await capture(() => update(opts));
                        assert.match(unchanged, /files=0/);
                        await capture(() => uninstall(opts));
                        assert.ok(!existsSync(path.join(p.skills, "implement-change", "SKILL.md")));
                        if (p.ruleFile) assert.doesNotMatch(read(p.ruleFile), /<!-- pack:/);
                    },
                );
            }
        await t.test("exact ownership, unrelated skills and user-added files survive", async () => {
            const root = cwd("exact");
            const base = { project: true, tool: "cursor", cwd: root };
            await capture(() => install({ ...base, pack: "general" }));
            await capture(() => install({ ...base, pack: "git", priority: "p1" }));
            const extra = path.join(root, ".cursor/skills/git-bisect/my-note.md");
            put(extra, "mine");
            await capture(() => uninstall({ ...base, pack: "general", item: "git" }));
            assert.ok(existsSync(path.join(root, ".cursor/skills/git-bisect/SKILL.md")));
            assert.ok(existsSync(path.join(root, ".cursor/skills/using-git-worktrees/SKILL.md")));
            await capture(() => uninstall({ ...base, pack: "git", item: "git-bisect" }));
            assert.equal(read(extra), "mine");
        });
        await t.test("shared rule state and legacy state survive sequential removals", async () => {
            const root = cwd("shared");
            const base = { project: true, tool: "claude", cwd: root };
            put(path.join(root, "CLAUDE.md"), "User instructions\n");
            await capture(() => install(base));
            const file = path.join(root, ".packfuse/state.json");
            const state = json(file);
            delete state.claude.installations;
            put(file, JSON.stringify(state));
            await capture(() => uninstall({ ...base, pack: "general", item: "requirements" }));
            assert.ok(json(file).claude.paths.includes(path.join(root, "CLAUDE.md")));
            await capture(() => uninstall({ ...base, pack: "general", item: "safety" }));
            assert.doesNotMatch(
                read(path.join(root, "CLAUDE.md")),
                /pack:general:(requirements|safety)/,
            );
            assert.match(read(path.join(root, "CLAUDE.md")), /User instructions/);
            assert.match(read(path.join(root, "CLAUDE.md")), /pack:general:verification/);
        });
        await t.test("dependent removal fails before any mutation", async () => {
            const root = cwd("requires");
            const opts = { project: true, tool: "cursor", cwd: root, pack: "general" };
            await capture(() => install({ ...opts, item: "subagent-driven-development" }));
            const before = tree(root);
            await assert.rejects(() => uninstall({ ...opts, item: "reviewer" }), /required by/);
            assert.deepEqual(tree(root), before);
        });
        for (const tool of ["cursor", "claude"] as const)
            await t.test(`${tool}: preserve third-party hooks and remove owned hook`, async () => {
                const root = cwd(`hooks-${tool}`);
                const opts = {
                    project: true,
                    tool,
                    cwd: root,
                    pack: "general",
                    item: "beforeShellExecution",
                };
                const p = toolPaths(tool, "project", root);
                const event = tool === "cursor" ? "beforeShellExecution" : "PreToolUse";
                const foreign =
                    tool === "cursor"
                        ? { command: "user-hook" }
                        : { matcher: "Bash", hooks: [{ type: "command", command: "user-hook" }] };
                put(p.hooks!, JSON.stringify({ userSetting: 7, hooks: { [event]: [foreign] } }));
                await capture(() => install(opts));
                await capture(() => install(opts));
                assert.equal(json(p.hooks!).hooks[event].length, 2);
                const cmd =
                    tool === "cursor"
                        ? json(p.hooks!).hooks[event][1].command
                        : json(p.hooks!).hooks[event][1].hooks[0].command;
                assert.match(cmd, /--tool/);
                const result = spawnSync(cmd, {
                    shell: true,
                    input: JSON.stringify(
                        tool === "cursor"
                            ? { command: "git push origin --force" }
                            : {
                                  hook_event_name: "PreToolUse",
                                  tool_input: { command: "git push origin --force" },
                              },
                    ),
                    encoding: "utf8",
                });
                assert.equal(result.status, 0, result.stderr);
                assert.match(result.stdout, /deny/);
                await capture(() => uninstall(opts));
                assert.deepEqual(json(p.hooks!).hooks[event], [foreign]);
                assert.equal(json(p.hooks!).userSetting, 7);
                assert.ok(!existsSync(path.join(p.hookScripts!, "beforeShellExecution.mjs")));
            });
        await t.test("per-tool update cannot spread packs into another tool", async () => {
            const root = cwd("versions");
            const opts = { project: true, cwd: root };
            await capture(() => install({ ...opts, tool: "cursor", pack: "git" }));
            await capture(() => install({ ...opts, tool: "claude", pack: "api" }));
            const file = path.join(root, ".packfuse/state.json");
            const s = json(file);
            for (const r of Object.values(s.cursor.installations) as any[]) r.version = "0.9.0";
            for (const r of Object.values(s.claude.installations) as any[]) r.version = "0.9.0";
            put(file, JSON.stringify(s));
            await capture(() => update({ ...opts, tool: "cursor" }));
            assert.equal(json(file).claude.installations["api:api-design"].version, "0.9.0");
            await capture(() => update(opts));
            assert.ok(!existsSync(path.join(root, ".claude/skills/commit-by-theme/SKILL.md")));
            assert.ok(!existsSync(path.join(root, ".cursor/skills/api-design/SKILL.md")));
        });
        await t.test("foreign skill ownership and rule collision protection", async () => {
            const root = cwd("foreign");
            const opts = { project: true, tool: "cursor", cwd: root };
            const file = path.join(root, ".cursor/skills/api-design/SKILL.md");
            put(file, "foreign");
            await capture(() => install({ ...opts, pack: "api" }));
            await capture(() => uninstall({ ...opts, pack: "api" }));
            assert.equal(read(file), "foreign");
            put(path.join(root, ".cursor/rules/verification.mdc"), "user rule");
            const before = tree(root);
            await assert.rejects(() => capture(() => install(opts)), /unmanaged/);
            assert.deepEqual(tree(root), before);
        });
        await t.test("invalid arguments do not write", async () => {
            await assert.rejects(() => resolveScope({ home: true, project: true }), /Conflicting/);
            await assert.rejects(() => resolveScope({ project: true, priority: "p9" }), /priority/);
            await assert.rejects(
                () => uninstall({ project: true, item: "git", tool: "cursor" }),
                /requires --pack/,
            );
        });
        await t.test(
            "doctor checks dependencies, missing files and duplicates for Codex",
            async () => {
                const root = cwd("doctor");
                const opts = {
                    project: true,
                    tool: "codex",
                    cwd: root,
                    pack: "general",
                    item: "subagent-driven-development",
                };
                await capture(() => install(opts));
                const p = toolPaths("codex", "project", root);
                rmSync(path.join(p.agents, "reviewer.toml"));
                put(path.join(home, ".agents/skills/writing-plans/SKILL.md"), "foreign");
                const stateFile = path.join(root, ".packfuse/state.json");
                const s = json(stateFile);
                delete s.codex.installations["general:writing-plans"];
                s.codex.items = s.codex.items.filter((k: string) => k !== "general:writing-plans");
                put(stateFile, JSON.stringify(s));
                const report = await capture(() =>
                    doctor({ project: true, tool: "codex", cwd: root }),
                );
                assert.match(report, /missing file/);
                assert.match(report, /missing dependency/);
                assert.match(report, /duplicate skill writing-plans/);
            },
        );
        await t.test("file transaction preflight prevents partial writes", () => {
            const root = cwd("transaction");
            put(path.join(root, "one.txt"), "before");
            mkdirSync(path.join(root, "directory"));
            const tx = new FileTransaction();
            tx.write(path.join(root, "one.txt"), "after");
            tx.write(path.join(root, "directory"), "invalid");
            assert.throws(() => tx.commit(), /regular file/);
            assert.equal(read(path.join(root, "one.txt")), "before");
        });
        await t.test("file transaction rejects a file used as a parent before writing", () => {
            const root = cwd("parent-file");
            const first = path.join(root, "first.txt");
            put(first, "before");
            put(path.join(root, "blocked"), "regular file");
            const tx = new FileTransaction();
            tx.write(first, "after");
            tx.write(path.join(root, "blocked", "file.txt"), "invalid");
            assert.throws(() => tx.commit(), /directory/);
            assert.equal(read(first), "before");
        });
        await t.test("file transaction preserves existing permissions", () => {
            const root = cwd("permissions");
            const file = path.join(root, "settings.json");
            put(file, "private");
            fs.chmodSync(file, 0o600);
            const tx = new FileTransaction();
            tx.write(file, "updated");
            tx.commit();
            assert.equal(read(file), "updated");
            if (process.platform !== "win32") assert.equal(fs.statSync(file).mode & 0o777, 0o600);
        });
        await t.test("rollback restores content and permissions after a write failure", (sub) => {
            const root = cwd("rollback-write");
            const first = path.join(root, "first.txt");
            const second = path.join(root, "second.txt");
            put(first, "before");
            put(second, "original");
            fs.chmodSync(first, 0o600);
            const rename = fs.renameSync;
            let injected = false;
            const mock = sub.mock.method(fs, "renameSync", (from: fs.PathLike, to: fs.PathLike) => {
                if (String(to) === second && !injected) {
                    injected = true;
                    throw Object.assign(new Error("injected write failure"), { code: "EIO" });
                }
                return rename(from, to);
            });
            syncBuiltinESMExports();
            try {
                const tx = new FileTransaction();
                tx.write(first, "after");
                tx.write(second, "new");
                assert.throws(() => tx.commit(), /injected write failure/);
                assert.equal(read(first), "before");
                assert.equal(read(second), "original");
                if (process.platform !== "win32")
                    assert.equal(fs.statSync(first).mode & 0o777, 0o600);
            } finally {
                mock.mock.restore();
                syncBuiltinESMExports();
            }
        });
        await t.test("rollback continues when restoring one file fails", (sub) => {
            const root = cwd("rollback-recovery");
            const first = path.join(root, "first.txt");
            const second = path.join(root, "second.txt");
            const third = path.join(root, "third.txt");
            put(first, "before-a");
            put(second, "before-b");
            put(third, "before-c");
            const rename = fs.renameSync;
            let failed = false;
            const mock = sub.mock.method(fs, "renameSync", (from: fs.PathLike, to: fs.PathLike) => {
                if (String(to) === third) {
                    failed = true;
                    throw new Error("injected commit failure");
                }
                if (failed && String(to) === second) throw new Error("injected recovery failure");
                return rename(from, to);
            });
            syncBuiltinESMExports();
            try {
                const tx = new FileTransaction();
                tx.write(first, "after-a");
                tx.write(second, "after-b");
                tx.write(third, "after-c");
                assert.throws(
                    () => tx.commit(),
                    (error: unknown) => {
                        assert.ok(error instanceof AggregateError);
                        assert.match(error.message, /rollback/i);
                        assert.ok(
                            error.errors.some((e: Error) => /commit failure/.test(e.message)),
                        );
                        assert.ok(error.errors.some((e: Error) => /second\.txt/.test(e.message)));
                        return true;
                    },
                );
                assert.equal(read(first), "before-a");
                assert.equal(read(second), "after-b");
                assert.equal(read(third), "before-c");
            } finally {
                mock.mock.restore();
                syncBuiltinESMExports();
            }
        });
        await t.test("marked rule changes preserve user whitespace outside the block", () => {
            const prefix = "    const instruction = true;\n\n\nUser section\n\n";
            const suffix = "\n\n    trailing instruction\n ";
            const block =
                "<!-- pack:general:safety -->\nManaged rule\n<!-- /pack:general:safety -->\n";
            assert.equal(
                removeMarked(prefix + block + suffix, "general", "safety"),
                prefix + suffix,
            );
            assert.equal(removeMarked(prefix + suffix, "general", "safety"), prefix + suffix);
            const added = upsertMarked(prefix + suffix, "general", "safety", "New rule");
            assert.ok(added.startsWith(prefix + suffix));
            assert.equal(
                removeMarked(added, "general", "safety").slice(0, (prefix + suffix).length),
                prefix + suffix,
            );
            const crlf =
                "    user\r\n\r\n<!-- pack:general:safety -->\r\nrule\r\n<!-- /pack:general:safety -->\r\n    end\r\n";
            assert.equal(removeMarked(crlf, "general", "safety"), "    user\r\n\r\n    end\r\n");
            assert.equal(
                upsertMarked(crlf, "general", "safety", "New rule"),
                "    user\r\n\r\n<!-- pack:general:safety -->\nNew rule\n<!-- /pack:general:safety -->\n    end\r\n",
            );
        });
        await t.test("format hook runs configured local script for the edited file only", () => {
            const root = cwd("formatter");
            put(
                path.join(root, "package.json"),
                JSON.stringify({
                    packfuse: { format: { script: "format.mjs", args: ["{file}"] } },
                }),
            );
            put(
                path.join(root, "format.mjs"),
                'import{writeFileSync}from"node:fs";writeFileSync(process.argv[2],"formatted");',
            );
            const target = path.join(root, "file with spaces.txt");
            put(target, "original");
            const other = path.join(root, "other.txt");
            put(other, "untouched");
            const result = spawnSync(
                process.execPath,
                [path.resolve("packs/general/hooks/afterFileEdit/run.mjs")],
                { input: JSON.stringify({ cwd: root, file_path: target }), encoding: "utf8" },
            );
            assert.equal(result.status, 0, result.stderr);
            assert.equal(read(target), "formatted");
            assert.equal(read(other), "untouched");
        });
        await t.test(
            "docs relay prints the official installer and runs only for that pack",
            async () => {
                const root = cwd("docs-relay");
                const dry = await capture(() =>
                    install({
                        project: true,
                        tool: "cursor",
                        cwd: root,
                        pack: "docs",
                        dryRun: true,
                        relayRunner: () => {
                            throw new Error("dry-run spawned");
                        },
                    }),
                );
                assert.match(dry, /npx --yes skills add https:\/\/github.com\/anthropics\/skills/);
                assert.match(dry, /-a cursor/);
                assert.match(dry, /--skill pdf/);
                assert.match(dry, /--skill xlsx/);
                assert.match(dry, /dry-run: relay not executed/);
                assert.doesNotMatch(dry, /-g/);
                const calls: { args: string[]; cwd: string }[] = [];
                await capture(() =>
                    install({
                        home: true,
                        tool: "claude",
                        cwd: root,
                        pack: "docs",
                        relayRunner: (args, dir) => {
                            calls.push({ args, cwd: dir });
                        },
                    }),
                );
                assert.deepEqual(
                    calls[0].args,
                    relayArgv(
                        {
                            source: "https://github.com/anthropics/skills",
                            skills: ["pdf", "docx", "pptx", "xlsx"],
                        },
                        "claude",
                        "home",
                    ),
                );
                assert.ok(calls[0].args.includes("-g"));
                assert.ok(calls[0].args.includes("claude-code"));
                const plain = await capture(() =>
                    install({
                        project: true,
                        tool: "cursor",
                        cwd: root,
                        pack: "general",
                        dryRun: true,
                    }),
                );
                assert.doesNotMatch(plain, /anthropics\/skills/);
                const removed = await capture(() =>
                    uninstall({ project: true, tool: "cursor", cwd: root, pack: "docs" }),
                );
                assert.match(removed, /does not remove official skills/);
            },
        );
    } finally {
        rmSync(temp, { recursive: true, force: true });
    }
});
