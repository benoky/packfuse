import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, rmdirSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import YAML from "yaml";
import type { Installation, LockFile, PackRelay, SelectedItem, StateFile, Tool } from "./types.js";
import {
    detectMarkers,
    homeDir,
    lockPath,
    projectDir,
    statePath,
    toolPaths,
    type Scope,
} from "./paths.js";
import {
    allItems,
    filterByPriority,
    findItem,
    listSkillNamesOnDisk,
    loadIndex,
    loadPack,
    officialSkillName,
    resolveRequires,
    skillDir,
} from "./manifest.js";
import {
    agentCodexToml,
    agentCursorClaude,
    cursorMdc,
    hookScript,
    parseMd,
    removeMarked,
    ruleMarkdown,
    skillMarkdown,
    upsertMarked,
} from "./convert.js";
import { estimateTokens } from "./tokens.js";
import { addLockItem, itemStillInstalled, readLock, readState } from "./store.js";
import { FileTransaction } from "./transaction.js";

export interface CommonOpts {
    home?: boolean;
    project?: boolean;
    scope?: string;
    tool?: string;
    pack?: string;
    item?: string;
    priority?: string;
    dryRun?: boolean;
    all?: boolean;
    cwd?: string;
    relayRunner?: (args: string[], cwd: string) => void;
}
const toolNames: Tool[] = ["cursor", "claude", "codex"];
/** 1.0.0 catalog ids. The docs pack is now a relay and has no items with these ids. */
const retiredDocs = new Set([
    "docs:docs-pdf",
    "docs:docs-docx",
    "docs:docs-pptx",
    "docs:docs-xlsx",
]);
function isRetiredDocs(key: string): boolean {
    return retiredDocs.has(key);
}
function catalogItem(pack: string, id: string): SelectedItem | undefined {
    if (isRetiredDocs(`${pack}:${id}`)) return undefined;
    return allItems().find((x) => x.pack === pack && x.item.id === id);
}
function retiredDocsNotice(key: string): void {
    console.log(
        `skip ${key} (removed from the catalog; updating the official pdf, docx, pptx, and xlsx skills)`,
    );
}
function rememberRelay(lock: LockFile, pack: string): boolean {
    if (!loadPack(pack).relay) return false;
    lock.relays ??= [];
    if (lock.relays.includes(pack)) return false;
    lock.relays.push(pack);
    return true;
}
function relayOwnedTools(lock: LockFile): Tool[] {
    const found = new Set<Tool>();
    for (const byTool of Object.values(lock.relayOwned ?? {})) {
        for (const tool of Object.keys(byTool) as Tool[]) found.add(tool);
    }
    return toolNames.filter((tool) => found.has(tool));
}
function claimRelayOwnership(
    lock: LockFile,
    pack: string,
    tool: Tool,
    relay: PackRelay,
    existingBefore: string[],
): boolean {
    const prev = lock.relayOwned?.[pack]?.[tool];
    const migrating = (lock.relays ?? []).includes(pack) && lock.relayOwned === undefined;
    const owned = migrating
        ? [...relay.skills]
        : relay.skills.filter(
              (skill) => (prev ?? []).includes(skill) || !existingBefore.includes(skill),
          );
    const same =
        prev !== undefined &&
        prev.length === owned.length &&
        prev.every((skill, i) => skill === owned[i]);
    lock.relayOwned ??= {};
    lock.relayOwned[pack] ??= {};
    lock.relayOwned[pack][tool] = owned;
    const added = rememberRelay(lock, pack);
    if (same && !added) return false;
    const skipped = relay.skills.filter((skill) => !owned.includes(skill));
    if (owned.length)
        console.log(`relay ${pack} -> ${tool}: owned official skills ${owned.join(", ")}`);
    if (skipped.length)
        console.log(
            `relay ${pack} -> ${tool}: preserved existing official skills ${skipped.join(", ")}`,
        );
    return true;
}
function forgetRelaySkills(lock: LockFile, pack: string, tool: Tool, names: string[]): boolean {
    const owned = lock.relayOwned?.[pack]?.[tool];
    if (!owned?.length) return false;
    const next = owned.filter((skill) => !names.includes(skill));
    if (next.length === owned.length) return false;
    if (next.length) lock.relayOwned![pack]![tool] = next;
    else forgetRelayTool(lock, pack, tool);
    return true;
}
function forgetRelayTool(lock: LockFile, pack: string, tool: Tool): void {
    if (lock.relayOwned?.[pack]) {
        delete lock.relayOwned[pack][tool];
        if (!Object.keys(lock.relayOwned[pack]).length) delete lock.relayOwned[pack];
        if (!Object.keys(lock.relayOwned).length) delete lock.relayOwned;
    }
    if (!lock.relayOwned?.[pack] && lock.relays) {
        lock.relays = lock.relays.filter((id) => id !== pack);
        if (!lock.relays.length) delete lock.relays;
    }
}
const keyOf = (s: SelectedItem) => `${s.pack}:${s.item.id}`;
const tty = () => Boolean(input.isTTY && output.isTTY);
function validateOptions(opts: CommonOpts): void {
    if (opts.scope && !["home", "project"].includes(opts.scope))
        throw new Error("--scope must be home|project");
    if (
        (opts.home && opts.project) ||
        (opts.home && opts.scope === "project") ||
        (opts.project && opts.scope === "home")
    )
        throw new Error("Conflicting scope flags");
    if (opts.priority && !["p0", "p1", "p2"].includes(opts.priority))
        throw new Error("--priority must be p0|p1|p2");
    if (opts.tool && !toolNames.includes(opts.tool as Tool))
        throw new Error(`Unknown tool ${opts.tool}`);
    if (opts.item && !opts.pack) throw new Error("--item requires --pack");
    if (opts.all && opts.tool) throw new Error("Use --all or --tool, not both");
}
export async function resolveScope(opts: CommonOpts): Promise<Scope> {
    validateOptions(opts);
    if (opts.home || opts.scope === "home") return "home";
    if (opts.project || opts.scope === "project") return "project";
    if (!tty()) throw new Error("Pass --home or --project");
    const rl = readline.createInterface({ input, output });
    try {
        const answer = (await rl.question("Install where? [home/project]: ")).trim().toLowerCase();
        if (answer === "home" || answer === "project") return answer;
        throw new Error("Choose home or project");
    } finally {
        rl.close();
    }
}
export function resolveTools(scope: Scope, opts: CommonOpts): Tool[] {
    validateOptions(opts);
    if (opts.tool) return [opts.tool as Tool];
    const recorded = Object.keys(readState(scope, opts.cwd)) as Tool[];
    if (recorded.length) return recorded;
    const detected = detectMarkers(scope, opts.cwd);
    if (detected.length === 1) return detected;
    throw new Error("Pass --tool cursor|claude|codex (multiple or no tool markers)");
}
async function chooseTools(scope: Scope, opts: CommonOpts): Promise<Tool[]> {
    try {
        return resolveTools(scope, opts);
    } catch (error) {
        if (!tty() || opts.tool) throw error;
        const rl = readline.createInterface({ input, output });
        try {
            const tool = (await rl.question("Tool? [cursor/claude/codex]: ")).trim().toLowerCase();
            return resolveTools(scope, { ...opts, tool });
        } finally {
            rl.close();
        }
    }
}
function selected(scope: Scope, opts: CommonOpts): SelectedItem[] {
    if (opts.item) return resolveRequires([findItem(opts.pack!, opts.item)]);
    if (opts.pack) {
        const manifest = loadPack(opts.pack);
        const items = allItems().filter((x) => x.pack === opts.pack);
        if (!items.length && !manifest.relay) throw new Error(`Unknown pack ${opts.pack}`);
        return resolveRequires(
            filterByPriority(items, (opts.priority ?? "p0") as "p0" | "p1" | "p2"),
        );
    }
    const lock = readLock(scope, opts.cwd);
    if (!lock.items.length)
        return resolveRequires(
            filterByPriority(
                allItems().filter((x) => x.pack === "general"),
                (opts.priority ?? "p0") as "p0" | "p1" | "p2",
            ),
        );
    const restored: SelectedItem[] = [];
    for (const item of lock.items) {
        const key = `${item.pack}:${item.id}`;
        if (isRetiredDocs(key)) continue;
        const found = catalogItem(item.pack, item.id);
        if (!found) throw new Error(`Unknown item ${key}`);
        restored.push(found);
    }
    return resolveRequires(restored);
}
function filesUnder(dir: string): string[] {
    if (!existsSync(dir)) return [];
    if (lstatSync(dir).isSymbolicLink()) throw new Error(`Refusing symlink source: ${dir}`);
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const p = path.join(dir, entry.name);
        if (entry.isSymbolicLink()) throw new Error(`Refusing symlink source: ${p}`);
        return entry.isDirectory() ? filesUnder(p) : [p];
    });
}
function shellArg(value: string): string {
    if (process.platform === "win32") {
        if (/["%\r\n]/.test(value)) throw new Error("Unsupported character in Windows hook path");
        return `"${value.replace(/\\/g, "/")}"`;
    }
    return `'${value.replace(/'/g, `'"'"'`)}'`;
}
function hookInfo(sel: SelectedItem, tool: Tool, scope: Scope, cwd?: string) {
    const p = toolPaths(tool, scope, cwd);
    const script = path.join(p.hookScripts!, `${sel.item.id}.mjs`);
    const event =
        tool === "cursor"
            ? sel.item.id
            : {
                  beforeShellExecution: "PreToolUse",
                  afterFileEdit: "PostToolUse",
                  sessionEnd: "Stop",
              }[sel.item.id];
    if (!event) throw new Error(`No hook mapping: ${tool}:${sel.item.id}`);
    return {
        file: p.hooks!,
        event,
        command: `${shellArg(process.execPath)} ${shellArg(script)} --tool ${tool}`,
        legacyCommand: script,
    };
}
function refresh(entry: StateFile[string]): void {
    entry.items = Object.keys(entry.installations ?? {});
    entry.paths = [
        ...new Set(
            Object.values(entry.installations ?? {}).flatMap((r) => [
                ...r.files,
                ...(r.blockFile ? [r.blockFile] : []),
                ...(r.hook ? [r.hook.file] : []),
            ]),
        ),
    ];
}
/** Migrate old flat paths using exact destinations; never use substring ownership. */
function migrate(state: StateFile, scope: Scope, cwd?: string): void {
    const lock = readLock(scope, cwd);
    for (const [tool, entry] of Object.entries(state) as [Tool, StateFile[string]][]) {
        entry.installations ??= {};
        const p = toolPaths(tool, scope, cwd);
        for (const key of entry.items) {
            if (entry.installations[key]) continue;
            const [pack, id] = key.split(":");
            const sel = catalogItem(pack, id);
            if (!sel) {
                if (isRetiredDocs(key)) continue;
                throw new Error(`Unknown item ${pack}:${id}`);
            }
            const r: Installation = {
                version: lock.items.find((x) => x.pack === pack && x.id === id)?.version ?? "0.0.0",
                files: [],
            };
            if (sel.item.kind === "skill") {
                const dir = path.join(p.skills, id);
                const marker = path.join(dir, ".packfuse");
                if (sel.item.relay) {
                    if (existsSync(marker) && readFileSync(marker, "utf8").trim() === key) {
                        r.files = [path.join(dir, "SKILL.md"), marker].filter((file) =>
                            existsSync(file),
                        );
                    }
                } else if (existsSync(marker) && readFileSync(marker, "utf8").trim() === key) {
                    // Legacy state did not track extras: claim only known source files, preserving user extras.
                    r.files = [
                        path.join(dir, "SKILL.md"),
                        marker,
                        ...["references", "scripts"].flatMap((sub) =>
                            filesUnder(path.join(skillDir(sel), sub)).map((f) =>
                                path.join(dir, path.relative(skillDir(sel), f)),
                            ),
                        ),
                    ];
                } else r.external = true;
            } else if (sel.item.kind === "rule") {
                const rule = ruleMarkdown(sel, tool);
                if (tool === "cursor" && scope === "home") r.manual = true;
                else if (tool === "cursor")
                    r.files = [path.join(p.rules, `${id}.mdc`)].filter((f) =>
                        entry.paths.includes(f),
                    );
                else if (tool === "claude" && rule.globs)
                    r.files = [path.join(p.rules, `${id}.md`)].filter((f) =>
                        entry.paths.includes(f),
                    );
                else if (
                    p.ruleFile &&
                    existsSync(p.ruleFile) &&
                    readFileSync(p.ruleFile, "utf8").includes(`<!-- pack:${key} -->`)
                )
                    r.blockFile = p.ruleFile;
            } else if (sel.item.kind === "agent") {
                r.files = [path.join(p.agents, `${id}.${tool === "codex" ? "toml" : "md"}`)].filter(
                    (f) => entry.paths.includes(f),
                );
            } else if (p.hooks) {
                r.hook = hookInfo(sel, tool, scope, cwd);
                r.files = [r.hook.legacyCommand!];
            }
            entry.installations[key] = r;
        }
        refresh(entry);
    }
}
function assertOwnedPaths(
    record: Installation,
    sel: SelectedItem,
    tool: Tool,
    scope: Scope,
    cwd?: string,
): void {
    const p = toolPaths(tool, scope, cwd);
    const skillRoot = path.join(p.skills, sel.item.id);
    for (const file of record.files) {
        const resolved = path.resolve(file);
        const valid =
            sel.item.kind === "skill"
                ? resolved.startsWith(skillRoot + path.sep)
                : sel.item.kind === "rule"
                  ? resolved ===
                    path.join(p.rules, `${sel.item.id}.${tool === "cursor" ? "mdc" : "md"}`)
                  : sel.item.kind === "agent"
                    ? resolved ===
                      path.join(p.agents, `${sel.item.id}.${tool === "codex" ? "toml" : "md"}`)
                    : p.hookScripts && resolved === path.join(p.hookScripts, `${sel.item.id}.mjs`);
        if (!valid) throw new Error(`State path outside expected item destination: ${file}`);
    }
    if (record.blockFile && record.blockFile !== p.ruleFile)
        throw new Error("Invalid shared rule path in state");
    if (record.hook) {
        const expected = hookInfo(sel, tool, scope, cwd);
        if (
            record.hook.file !== expected.file ||
            record.hook.event !== expected.event ||
            record.hook.command !== expected.command ||
            record.hook.legacyCommand !== expected.legacyCommand
        ) {
            // Node may move between installs. Allow an old command only if it names the exact script.
            if (
                record.hook.file !== expected.file ||
                record.hook.event !== expected.event ||
                !record.hook.command.includes(shellArg(expected.legacyCommand!))
            )
                throw new Error("Invalid hook state");
        }
    }
}
function editHook(
    tx: FileTransaction,
    info: NonNullable<Installation["hook"]>,
    tool: Tool,
    id: string,
    add: boolean,
): void {
    const body = tx.read(info.file);
    const json = body ? JSON.parse(body) : {};
    if (!json || typeof json !== "object" || Array.isArray(json))
        throw new Error(`Invalid hook config ${info.file}`);
    json.hooks ??= {};
    if (!json.hooks || typeof json.hooks !== "object" || Array.isArray(json.hooks))
        throw new Error(`Invalid hooks ${info.file}`);
    const entries = json.hooks[info.event] ?? [];
    if (!Array.isArray(entries)) throw new Error(`Invalid hook event ${info.event}`);
    const matches = (command: unknown) =>
        command === info.command || command === info.legacyCommand;
    const kept = entries.flatMap((entry: any) => {
        if (tool === "cursor") return matches(entry.command) ? [] : [entry];
        if (!Array.isArray(entry.hooks)) return [entry];
        const hooks = entry.hooks.filter((h: any) => !matches(h.command));
        return hooks.length ? [{ ...entry, hooks }] : [];
    });
    if (add)
        kept.push(
            tool === "cursor"
                ? { command: info.command }
                : {
                      matcher: id === "beforeShellExecution" ? "Bash" : "Edit|Write|MultiEdit",
                      hooks: [{ type: "command", command: info.command }],
                  },
        );
    if (kept.length) json.hooks[info.event] = kept;
    else delete json.hooks[info.event];
    if (tool === "cursor") json.version ??= 1;
    if (body || add) tx.write(info.file, JSON.stringify(json, null, 2) + "\n");
}
function removeRecord(tx: FileTransaction, r: Installation, sel: SelectedItem, tool: Tool): void {
    if (r.external || r.manual) return;
    for (const f of r.files) tx.remove(f);
    if (r.blockFile)
        tx.write(r.blockFile, removeMarked(tx.read(r.blockFile), sel.pack, sel.item.id));
    if (r.hook) editHook(tx, r.hook, tool, sel.item.id, false);
}
function persist(
    tx: FileTransaction,
    state: StateFile,
    scope: Scope,
    opts: CommonOpts,
    lock: ReturnType<typeof readLock>,
): void {
    if (scope === "project") {
        const ignore = path.join(path.dirname(statePath(scope, opts.cwd)), ".gitignore");
        const previous = tx.read(ignore);
        if (!previous.split(/\r?\n/).includes("/state.json"))
            tx.write(
                ignore,
                previous + (previous && !previous.endsWith("\n") ? "\n" : "") + "/state.json\n",
            );
    }
    tx.write(statePath(scope, opts.cwd), JSON.stringify(state, null, 2) + "\n");
    tx.write(lockPath(scope, opts.cwd), JSON.stringify(lock, null, 2) + "\n");
}
function report(tx: FileTransaction, dry: boolean): void {
    console.log(dry ? "dry-run: no files changed" : "completed");
    for (const [f, body] of tx.changes) console.log(`  ${body === null ? "remove" : "write"} ${f}`);
    console.log(`files=${tx.changes.size}`);
}
async function applyInstall(opts: CommonOpts, updating: boolean): Promise<void> {
    const scope = await resolveScope(opts);
    const state = readState(scope, opts.cwd);
    if (updating && !Object.keys(state).length && !readLock(scope, opts.cwd).relays?.length) {
        console.log("nothing installed in this scope");
        return;
    }
    const tools = await chooseTools(scope, opts);
    migrate(state, scope, opts.cwd);
    const lock = readLock(scope, opts.cwd);
    const tx = new FileTransaction();
    const requested = updating ? [] : selected(scope, opts);
    let changed = false;
    const pendingRelays: { pack: string; source: string; skill: string; tool: Tool }[] = [];
    for (const tool of tools) {
        const entry = state[tool] ?? { paths: [], items: [], installations: {} };
        entry.installations ??= {};
        for (const key of [...entry.items]) {
            if (!isRetiredDocs(key)) continue;
            const record = entry.installations?.[key];
            if (record && !record.external && !record.manual)
                for (const file of record.files) tx.remove(file);
            delete entry.installations?.[key];
            retiredDocsNotice(key);
            if (rememberRelay(lock, "docs")) changed = true;
            changed = true;
        }
        refresh(entry);
        const seeds = updating
            ? entry.items.flatMap((key) => {
                  const [p, id] = key.split(":");
                  const sel = catalogItem(p, id);
                  if (!sel) throw new Error(`Unknown item ${key}`);
                  return [sel];
              })
            : requested;
        const items = resolveRequires(seeds).filter((sel) => {
            if (sel.item.tools.includes(tool)) return true;
            console.log(`skip ${keyOf(sel)} (not for ${tool})`);
            return false;
        });
        let tokenText = "";
        for (const sel of items) {
            const key = keyOf(sel);
            for (const dep of sel.item.requires ?? []) {
                const target = items.find((s) => keyOf(s) === dep);
                if (!target) throw new Error(`${key} requires ${dep}, unavailable for ${tool}`);
            }
            const old = entry.installations[key];
            if (old) assertOwnedPaths(old, sel, tool, scope, opts.cwd);
            const p = toolPaths(tool, scope, opts.cwd);
            if (sel.item.relay) {
                const official = officialSkillName(sel.item);
                const r: Installation = { version: sel.item.version, files: [] };
                for (const file of old?.files ?? []) tx.remove(file);
                const officialDir = path.join(p.skills, official);
                if (
                    existsSync(path.join(officialDir, "SKILL.md")) &&
                    !(lock.relayOwned?.[sel.pack]?.[tool] ?? []).includes(official)
                ) {
                    r.external = true;
                    console.log(`skip ${key} (external skill; not owned by packfuse)`);
                } else {
                    pendingRelays.push({
                        pack: sel.pack,
                        source: sel.item.relay.source,
                        skill: official,
                        tool,
                    });
                }
                if (old?.blockFile)
                    tx.write(
                        old.blockFile,
                        removeMarked(tx.read(old.blockFile), sel.pack, sel.item.id),
                    );
                if (old?.hook) editHook(tx, old.hook, tool, sel.item.id, false);
                const same =
                    old &&
                    old.version === r.version &&
                    Boolean(old.external) === Boolean(r.external) &&
                    !old.files.length;
                entry.installations[key] = r;
                addLockItem(lock, sel.pack, sel.item.id, sel.item.version, sel.item.priority);
                if (!same) changed = true;
                continue;
            }
            if (updating && old?.version === sel.item.version && !old.external) continue;
            const r: Installation = { version: sel.item.version, files: [] };
            const writeOwned = (f: string, body: string | Buffer) => {
                if (existsSync(f) && !old?.files.includes(f))
                    throw new Error(`Refusing to overwrite unmanaged file: ${f}`);
                tx.write(f, body);
                r.files.push(f);
            };
            if (sel.item.kind === "skill") {
                const dir = path.join(p.skills, sel.item.id);
                if (existsSync(dir) && (!old || old.external)) {
                    if (!existsSync(path.join(dir, "SKILL.md")))
                        throw new Error(`Unmanaged skill directory: ${dir}`);
                    r.external = true;
                    console.log(`skip ${key} (external skill; not owned by packfuse)`);
                } else {
                    writeOwned(path.join(dir, "SKILL.md"), skillMarkdown(sel, tool));
                    writeOwned(path.join(dir, ".packfuse"), key);
                    for (const sub of ["references", "scripts", "assets", "agents"]) {
                        for (const src of filesUnder(path.join(skillDir(sel), sub))) {
                            const dest = path.join(dir, path.relative(skillDir(sel), src));
                            writeOwned(dest, readFileSync(src));
                        }
                    }
                    if (tool === "codex") {
                        const file = path.join(dir, "agents", "openai.yaml");
                        const metadata = YAML.parse(tx.read(file) || "{}");
                        metadata.policy = {
                            ...metadata.policy,
                            allow_implicit_invocation: sel.item.invoke !== "slash",
                        };
                        writeOwned(file, YAML.stringify(metadata));
                    }
                    if (sel.item.invoke === "auto")
                        tokenText +=
                            String(
                                parseMd(path.join(skillDir(sel), "SKILL.md")).data.description ??
                                    "",
                            ) + "\n";
                }
                if (sel.item.vendor)
                    console.log(`vendor setup (manual; not executed): ${sel.item.vendor}`);
            } else if (sel.item.kind === "rule") {
                const rule = ruleMarkdown(sel, tool);
                if (rule.always && !rule.globs) tokenText += rule.body + "\n";
                if (tool === "cursor" && scope === "home") {
                    r.manual = true;
                    console.log(`Paste into Cursor User Rules (${key}):\n${rule.body}`);
                } else if (tool === "cursor")
                    writeOwned(path.join(p.rules, `${sel.item.id}.mdc`), cursorMdc(sel));
                else if (tool === "claude" && rule.globs)
                    writeOwned(
                        path.join(p.rules, `${sel.item.id}.md`),
                        `---\n${YAML.stringify({ paths: [rule.globs] })}---\n\n${rule.body}\n`,
                    );
                else if (p.ruleFile) {
                    r.blockFile = p.ruleFile;
                    const body = rule.globs
                        ? `Applies to: ${rule.globs}\n\n${rule.body}`
                        : rule.body;
                    tx.write(
                        p.ruleFile,
                        upsertMarked(tx.read(p.ruleFile), sel.pack, sel.item.id, body),
                    );
                }
            } else if (sel.item.kind === "agent") {
                writeOwned(
                    path.join(p.agents, `${sel.item.id}.${tool === "codex" ? "toml" : "md"}`),
                    tool === "codex" ? agentCodexToml(sel) : agentCursorClaude(sel),
                );
            } else if (p.hooks && p.hookScripts) {
                if (old?.hook) editHook(tx, old.hook, tool, sel.item.id, false);
                r.hook = hookInfo(sel, tool, scope, opts.cwd);
                writeOwned(r.hook.legacyCommand!, readFileSync(hookScript(sel), "utf8"));
                editHook(tx, r.hook, tool, sel.item.id, true);
                if (scope === "home")
                    console.log("Note: home hooks apply across this user's repositories.");
            }
            // Remove only tracked obsolete files, never user-added files.
            for (const f of old?.files ?? []) if (!r.files.includes(f)) tx.remove(f);
            if (old?.blockFile && old.blockFile !== r.blockFile)
                tx.write(
                    old.blockFile,
                    removeMarked(tx.read(old.blockFile), sel.pack, sel.item.id),
                );
            if (old?.hook && !r.hook) editHook(tx, old.hook, tool, sel.item.id, false);
            entry.installations[key] = r;
            addLockItem(lock, sel.pack, sel.item.id, sel.item.version, sel.item.priority);
            changed = true;
        }
        refresh(entry);
        if (entry.items.length) state[tool] = entry;
        console.log(
            `${tool}: estimated selected always-on tokens≈${estimateTokens(tokenText)} (character approximation, not a model tokenizer; descriptions + unconditional rules; excludes host prompts)`,
        );
    }
    lock.items = lock.items.filter(
        (item) =>
            !isRetiredDocs(`${item.pack}:${item.id}`) ||
            itemStillInstalled(state, `${item.pack}:${item.id}`),
    );
    const relayIds = new Set<string>();
    if (updating) {
        for (const id of lock.relays ?? []) if (loadPack(id).relay) relayIds.add(id);
    } else if (opts.pack && loadPack(opts.pack).relay) {
        relayIds.add(opts.pack);
    }
    for (const id of relayIds) {
        const relay = loadPack(id).relay;
        if (!relay) continue;
        for (const tool of tools) {
            for (const skill of relay.skills)
                pendingRelays.push({ pack: id, source: relay.source, skill, tool });
        }
    }
    const relayRuns: { pack: string; relay: PackRelay; tool: Tool }[] = [];
    for (const tool of tools) {
        const existing = listSkillNamesOnDisk(toolPaths(tool, scope, opts.cwd).skills);
        const packs = new Set(pendingRelays.filter((job) => job.tool === tool).map((job) => job.pack));
        for (const pack of packs) {
            const jobs = pendingRelays.filter((job) => job.tool === tool && job.pack === pack);
            const bySource = new Map<string, string[]>();
            for (const job of jobs) {
                const skills = bySource.get(job.source) ?? [];
                if (!skills.includes(job.skill)) skills.push(job.skill);
                bySource.set(job.source, skills);
            }
            for (const [source, skills] of bySource) {
                const relay = { source, skills };
                if (claimRelayOwnership(lock, pack, tool, relay, existing)) changed = true;
                const owned = lock.relayOwned?.[pack]?.[tool]?.filter((skill) =>
                    skills.includes(skill),
                );
                if (owned?.length) relayRuns.push({ pack, relay: { source, skills: owned }, tool });
            }
        }
    }
    if (changed || lock.items.length !== readLock(scope, opts.cwd).items.length) changed = true;
    if (changed) persist(tx, state, scope, opts, lock);
    if (!opts.dryRun) {
        tx.commit();
        for (const [file, body] of tx.changes)
            if (body === null) {
                let dir = path.dirname(file);
                for (let i = 0; i < 4; i++, dir = path.dirname(dir)) {
                    try {
                        rmdirSync(dir);
                    } catch {
                        break;
                    }
                }
            }
    }
    for (const run of relayRuns)
        runRelay(run.relay, [run.tool], scope, { ...opts, pack: run.pack });
    report(tx, Boolean(opts.dryRun));
}
const relayAgent: Record<Tool, string> = {
    cursor: "cursor",
    claude: "claude-code",
    codex: "codex",
};
export function relayArgv(relay: PackRelay, tool: Tool, scope: Scope): string[] {
    return [
        "--yes",
        "skills",
        "add",
        relay.source,
        "-y",
        "-a",
        relayAgent[tool],
        ...(scope === "home" ? ["-g"] : []),
        ...relay.skills.flatMap((skill) => ["--skill", skill]),
    ];
}
export function relayRemoveArgv(skills: string[], tool: Tool, scope: Scope): string[] {
    if (!skills.length) throw new Error("relay remove requires owned skill names");
    if (skills.some((skill) => !/^[a-z0-9-]+$/.test(skill)))
        throw new Error("Invalid official skill name");
    return [
        "--yes",
        "skills",
        "remove",
        ...skills,
        "-y",
        "-a",
        relayAgent[tool],
        ...(scope === "home" ? ["-g"] : []),
    ];
}
function defaultRelayRunner(args: string[], cwd: string): void {
    const result = spawnSync("npx", args, {
        cwd,
        stdio: "inherit",
        shell: process.platform === "win32",
    });
    if (result.error) throw result.error;
    if (result.status !== 0)
        throw new Error(`Official skill install failed (exit ${result.status})`);
}
function runRelay(
    relay: PackRelay | undefined,
    tools: Tool[],
    scope: Scope,
    opts: CommonOpts,
): void {
    if (!relay) return;
    const cwd = scope === "home" ? homeDir() : projectDir(opts.cwd);
    for (const tool of tools) {
        const args = relayArgv(relay, tool, scope);
        console.log(`relay ${opts.pack} -> ${tool}: npx ${args.join(" ")}`);
        console.log(
            `Official skills (${relay.skills.join(", ")}) are installed by the skills CLI. packfuse does not copy them. uninstall removes names it recorded as owned.`,
        );
        if (opts.dryRun) console.log("dry-run: relay not executed");
        else (opts.relayRunner ?? defaultRelayRunner)(args, cwd);
    }
}
export async function install(opts: CommonOpts): Promise<void> {
    await applyInstall(opts, false);
}
export async function update(opts: CommonOpts): Promise<void> {
    await applyInstall(opts, true);
}
function uninstallRelayPack(
    lock: LockFile,
    pack: string,
    tools: Tool[],
    scope: Scope,
    opts: CommonOpts,
): boolean {
    const relay = loadPack(pack).relay;
    if (!relay) return false;
    const recorded = (lock.relays ?? []).includes(pack) || Boolean(lock.relayOwned?.[pack]);
    if (!recorded) {
        console.log(`relay ${pack} is not installed in this scope`);
        return false;
    }
    const cwd = scope === "home" ? homeDir() : projectDir(opts.cwd);
    let changed = false;
    for (const tool of tools) {
        const owned = lock.relayOwned?.[pack]?.[tool] ?? [];
        if (owned.length) {
            const args = relayRemoveArgv(owned, tool, scope);
            console.log(`relay remove ${pack} -> ${tool}: npx ${args.join(" ")}`);
            if (opts.dryRun) console.log("dry-run: relay not executed");
            else (opts.relayRunner ?? defaultRelayRunner)(args, cwd);
        } else if ((lock.relays ?? []).includes(pack) && lock.relayOwned === undefined) {
            console.log(
                `relay ${pack} on ${tool}: no ownership record; not removing official skills`,
            );
        }
        forgetRelayTool(lock, pack, tool);
        changed = true;
    }
    return changed;
}
export async function uninstall(opts: CommonOpts): Promise<void> {
    const scope = await resolveScope(opts);
    if (!opts.tool && !opts.all) throw new Error("uninstall requires --tool or --all");
    if (opts.pack && !allItems().some((s) => s.pack === opts.pack) && !loadPack(opts.pack).relay)
        throw new Error(`Unknown pack ${opts.pack}`);
    if (opts.item) findItem(opts.pack!, opts.item);
    const state = readState(scope, opts.cwd);
    migrate(state, scope, opts.cwd);
    const lock = readLock(scope, opts.cwd);
    const tools = opts.all
        ? toolNames.filter(
              (tool) => Object.keys(state).includes(tool) || relayOwnedTools(lock).includes(tool),
          )
        : resolveTools(scope, opts);
    const tx = new FileTransaction();
    const removed = new Set<string>();
    const relayRemovals: { pack: string; tool: Tool; skill: string }[] = [];
    for (const tool of tools) {
        const entry = state[tool];
        if (!entry) continue;
        const targets = entry.items.filter(
            (key) =>
                (!opts.pack || key.split(":")[0] === opts.pack) &&
                (!opts.item || key.split(":")[1] === opts.item),
        );
        for (const key of entry.items.filter((key) => !targets.includes(key))) {
            const [pack, id] = key.split(":");
            const kept = catalogItem(pack, id);
            if (!kept) continue;
            for (const dep of kept.item.requires ?? [])
                if (targets.includes(dep))
                    throw new Error(`Cannot remove ${dep}; required by ${key} on ${tool}`);
        }
        for (const key of targets) {
            const [pack, id] = key.split(":");
            if (isRetiredDocs(key)) {
                const record = entry.installations?.[key];
                if (record && !record.external && !record.manual)
                    for (const file of record.files) tx.remove(file);
                delete entry.installations?.[key];
                removed.add(key);
                retiredDocsNotice(key);
                continue;
            }
            const sel = findItem(pack, id);
            const r = entry.installations![key];
            assertOwnedPaths(r, sel, tool, scope, opts.cwd);
            removeRecord(tx, r, sel, tool);
            if (sel.item.relay && !r.external)
                relayRemovals.push({
                    pack,
                    tool,
                    skill: officialSkillName(sel.item),
                });
            if (r.external) console.log(`preserved external skill ${key}`);
            if (r.manual) console.log(`Remove ${key} from Cursor User Rules manually if pasted.`);
            delete entry.installations![key];
            removed.add(key);
        }
        refresh(entry);
        if (!entry.items.length) delete state[tool];
    }
    lock.items = lock.items.filter(
        (i) => !removed.has(`${i.pack}:${i.id}`) || itemStillInstalled(state, `${i.pack}:${i.id}`),
    );
    const relayPacks = opts.item
        ? []
        : opts.pack
          ? loadPack(opts.pack).relay
              ? [opts.pack]
              : []
          : [...(lock.relays ?? [])];
    let relayChanged = false;
    if (!tools.length && !opts.item && (opts.all || opts.pack) && lock.relays?.length) {
        console.log("relay recorded without tool ownership; clearing lock only");
        if (opts.pack) {
            lock.relays = lock.relays.filter((id) => id !== opts.pack);
            if (!lock.relays.length) delete lock.relays;
            if (lock.relayOwned) {
                delete lock.relayOwned[opts.pack];
                if (!Object.keys(lock.relayOwned).length) delete lock.relayOwned;
            }
        } else {
            delete lock.relays;
            delete lock.relayOwned;
        }
        relayChanged = true;
    }
    for (const pack of relayPacks) {
        if (uninstallRelayPack(lock, pack, tools, scope, opts)) relayChanged = true;
    }
    const grouped = new Map<string, { pack: string; tool: Tool; skills: string[] }>();
    for (const row of relayRemovals) {
        const key = `${row.pack}:${row.tool}`;
        const group = grouped.get(key) ?? { pack: row.pack, tool: row.tool, skills: [] };
        if (!group.skills.includes(row.skill)) group.skills.push(row.skill);
        grouped.set(key, group);
    }
    for (const group of grouped.values()) {
        const owned = (lock.relayOwned?.[group.pack]?.[group.tool] ?? []).filter((skill) =>
            group.skills.includes(skill),
        );
        if (owned.length) {
            const args = relayRemoveArgv(owned, group.tool, scope);
            console.log(`relay remove ${group.pack} -> ${group.tool}: npx ${args.join(" ")}`);
            if (opts.dryRun) console.log("dry-run: relay not executed");
            else
                (opts.relayRunner ?? defaultRelayRunner)(
                    args,
                    scope === "home" ? homeDir() : projectDir(opts.cwd),
                );
        }
        if (forgetRelaySkills(lock, group.pack, group.tool, group.skills)) relayChanged = true;
    }
    if (removed.size || relayChanged) persist(tx, state, scope, opts, lock);
    if (!opts.dryRun) {
        tx.commit();
        // Empty skill folders must not block a later reinstall. Never remove nonempty folders.
        for (const [file, body] of tx.changes)
            if (body === null) {
                let dir = path.dirname(file);
                for (let i = 0; i < 4; i++, dir = path.dirname(dir)) {
                    try {
                        rmdirSync(dir);
                    } catch {
                        break;
                    }
                }
            }
    }
    report(tx, Boolean(opts.dryRun));
}
export async function listCmd(opts: CommonOpts): Promise<void> {
    validateOptions(opts);
    for (const id of loadIndex().packs) {
        const relay = loadPack(id).relay;
        if (relay) console.log(`${id} relay [${relay.skills.join(",")}] ${relay.source}`);
    }
    for (const s of allItems())
        console.log(
            `${keyOf(s)} ${s.item.kind} ${s.item.priority} [${s.item.tools.join(",")}]${s.item.relay ? " relay" : ""}`,
        );
    if (!opts.home && !opts.project && !opts.scope) return;
    const scope = await resolveScope(opts);
    const state = readState(scope, opts.cwd);
    migrate(state, scope, opts.cwd);
    const lock = readLock(scope, opts.cwd);
    for (const [tool, entry] of Object.entries(state)) {
        if (opts.tool && tool !== opts.tool) continue;
        for (const [key, r] of Object.entries(entry.installations ?? {}))
            console.log(
                `${scope}/${tool}: ${key}@${r.version}${r.external ? " (external)" : r.manual ? " (manual paste)" : ""}`,
            );
    }
    for (const pack of lock.relays ?? []) {
        const owned = lock.relayOwned?.[pack] ?? {};
        for (const [tool, skills] of Object.entries(owned)) {
            if (opts.tool && tool !== opts.tool) continue;
            console.log(`${scope}/${tool}: ${pack} relay owned [${skills.join(",")}]`);
        }
    }
}
export async function doctor(opts: CommonOpts): Promise<void> {
    validateOptions(opts);
    const scopes: Scope[] =
        opts.home || opts.project || opts.scope ? [await resolveScope(opts)] : ["home", "project"];
    const tools = opts.tool ? [opts.tool as Tool] : toolNames;
    const problems: string[] = [];
    for (const scope of scopes) {
        const state = readState(scope, opts.cwd);
        const lock = readLock(scope, opts.cwd);
        migrate(state, scope, opts.cwd);
        for (const item of lock.items)
            if (!itemStillInstalled(state, `${item.pack}:${item.id}`))
                problems.push(`${scope}: lock/state mismatch ${item.pack}:${item.id}`);
        for (const pack of lock.relays ?? []) {
            if (!loadPack(pack).relay) problems.push(`${scope}: unknown relay ${pack}`);
            for (const tool of tools) {
                const owned = lock.relayOwned?.[pack]?.[tool];
                if (owned === undefined) {
                    if (lock.relayOwned === undefined)
                        console.log(`${scope}/${tool}: ${pack} relay (no ownership record)`);
                    continue;
                }
                const names = listSkillNamesOnDisk(toolPaths(tool, scope, opts.cwd).skills);
                for (const skill of owned) {
                    if (!names.includes(skill))
                        problems.push(
                            `${scope}/${tool}: owned official skill missing ${pack}:${skill}`,
                        );
                    else console.log(`${scope}/${tool}: ${pack} relay owned ${skill}`);
                }
            }
        }
        for (const tool of tools) {
            const entry = state[tool];
            if (!entry) continue;
            const p = toolPaths(tool, scope, opts.cwd);
            for (const [key, r] of Object.entries(entry.installations ?? {})) {
                const [pack, id] = key.split(":");
                const sel = catalogItem(pack, id);
                if (!sel) {
                    problems.push(
                        isRetiredDocs(key)
                            ? `${scope}/${tool}: ${key} was removed from the catalog; update drops it. install --pack docs installs the official skills`
                            : `${scope}/${tool}: unknown item ${key}`,
                    );
                    continue;
                }
                if (!lock.items.some((i) => i.pack === pack && i.id === id))
                    problems.push(`${scope}/${tool}: state/lock mismatch ${key}`);
                assertOwnedPaths(r, sel, tool, scope, opts.cwd);
                if (r.external) {
                    if (
                        !existsSync(
                            path.join(
                                p.skills,
                                sel.item.relay ? officialSkillName(sel.item) : id,
                                "SKILL.md",
                            ),
                        )
                    )
                        problems.push(`${scope}/${tool}: external skill missing ${key}`);
                    else console.log(`${scope}/${tool}: external skill ${key}`);
                }
                for (const f of r.files)
                    if (!existsSync(f)) problems.push(`${scope}/${tool}: missing file ${f}`);
                if (
                    r.blockFile &&
                    (!existsSync(r.blockFile) ||
                        !readFileSync(r.blockFile, "utf8").includes(`<!-- pack:${key} -->`))
                )
                    problems.push(`${scope}/${tool}: missing rule block ${key}`);
                if (r.hook) {
                    const config = existsSync(r.hook.file)
                        ? JSON.parse(readFileSync(r.hook.file, "utf8"))
                        : {};
                    const entries = config.hooks?.[r.hook.event] ?? [];
                    const commands =
                        tool === "cursor"
                            ? entries.map((e: any) => e.command)
                            : entries.flatMap((e: any) =>
                                  (e.hooks ?? []).map((h: any) => h.command),
                              );
                    if (
                        !commands.includes(r.hook.command) &&
                        !commands.includes(r.hook.legacyCommand)
                    )
                        problems.push(`${scope}/${tool}: missing hook entry ${key}`);
                }
                for (const dep of sel.item.requires ?? [])
                    if (!entry.items.includes(dep))
                        problems.push(`${scope}/${tool}: ${key} missing dependency ${dep}`);
                if (r.version !== sel.item.version)
                    problems.push(
                        `${scope}/${tool}: update available ${key} ${r.version} -> ${sel.item.version}`,
                    );
            }
            if (entry.items.some((k) => k.startsWith("general:"))) {
                for (const sel of allItems().filter(
                    (s) =>
                        s.pack === "general" &&
                        s.item.kind === "skill" &&
                        s.item.priority === "p0" &&
                        s.item.invoke === "auto" &&
                        !s.item.relay,
                )) {
                    if (
                        !["home", "project"].some((sc) =>
                            existsSync(
                                path.join(
                                    toolPaths(tool, sc as Scope, opts.cwd).skills,
                                    sel.item.id,
                                    "SKILL.md",
                                ),
                            ),
                        )
                    )
                        problems.push(`${scope}/${tool}: loop skill missing ${sel.item.id}`);
                }
            }
        }
    }
    for (const tool of tools) {
        const home = listSkillNamesOnDisk(toolPaths(tool, "home", opts.cwd).skills);
        const project = listSkillNamesOnDisk(toolPaths(tool, "project", opts.cwd).skills);
        for (const name of home)
            if (project.includes(name))
                problems.push(`${tool}: duplicate skill ${name} in home and project`);
    }
    problems.forEach((p) => console.log(p));
    console.log(`doctor: ${problems.length} issue(s)`);
}
/** Kept for clients of the old API; state is now local to each operation. */
export function resetStateCache(): void {}
