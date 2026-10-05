import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { SelectedItem, Tool } from "./types.js";
import { detectMarkers, toolPaths, type Scope } from "./paths.js";
import {
  allItems,
  filterByPriority,
  findItem,
  listSkillNamesOnDisk,
  resolveRequires,
  skillDir,
} from "./manifest.js";
import {
  agentCodexToml,
  agentCursorClaude,
  cursorMdc,
  hookScript,
  removeMarked,
  ruleMarkdown,
  skillMarkdown,
  upsertMarked,
} from "./convert.js";
import { estimateTokens } from "./tokens.js";
import {
  addLockItem,
  addStatePath,
  itemStillInstalled,
  readLock,
  readState,
  removeLockItem,
  removeStateItem,
  writeLock,
  writeState,
} from "./store.js";

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
}

function tty(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export async function resolveScope(opts: CommonOpts): Promise<Scope> {
  if (opts.home || opts.scope === "home") return "home";
  if (opts.project || opts.scope === "project") return "project";
  if (!tty()) throw new Error("Pass --home or --project");
  const rl = readline.createInterface({ input, output });
  const a = (await rl.question("Install where? [home/project]: ")).trim().toLowerCase();
  rl.close();
  if (a === "home" || a === "project") return a;
  throw new Error("Choose home or project");
}

export function resolveTools(scope: Scope, opts: CommonOpts): Tool[] {
  const cwd = opts.cwd;
  if (opts.tool) {
    const t = opts.tool as Tool;
    if (!["cursor", "claude", "codex"].includes(t)) throw new Error(`Unknown tool ${opts.tool}`);
    return [t];
  }
  const state = readState(scope, cwd);
  const recorded = Object.keys(state).filter((k) =>
    ["cursor", "claude", "codex"].includes(k),
  ) as Tool[];
  if (recorded.length) return recorded;
  const markers = detectMarkers(scope, cwd);
  if (markers.length === 1) return markers;
  throw new Error("Pass --tool cursor|claude|codex (multiple or no tool markers)");
}

function itemsForInstall(scope: Scope, opts: CommonOpts): SelectedItem[] {
  const all = allItems();
  if (opts.item) {
    if (!opts.pack) throw new Error("--item requires --pack");
    return resolveRequires([findItem(opts.pack, opts.item)]);
  }
  if (opts.pack) {
    const packItems = all.filter((x) => x.pack === opts.pack);
    if (!packItems.length) throw new Error(`Unknown pack ${opts.pack}`);
    const max = (opts.priority as "p0" | "p1" | "p2") ?? "p0";
    return resolveRequires(filterByPriority(packItems, max));
  }
  const lock = readLock(scope, opts.cwd);
  if (lock.items.length) {
    return resolveRequires(lock.items.map((x) => findItem(x.pack, x.id)));
  }
  return resolveRequires(filterByPriority(all.filter((x) => x.pack === "general"), "p0"));
}

function copySkillExtras(fromDir: string, toDir: string, written: string[]): void {
  for (const extra of ["references", "scripts"]) {
    const src = path.join(fromDir, extra);
    if (!existsSync(src)) continue;
    mkdirSync(path.join(toDir, extra), { recursive: true });
    copyDir(src, path.join(toDir, extra), written);
  }
}

function copyDir(src: string, dest: string, written: string[]): void {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (statSync(s).isDirectory()) copyDir(s, d, written);
    else {
      copyFileSync(s, d);
      written.push(d);
    }
  }
}

function mergeJsonHook(file: string, key: string, entry: unknown, dry: boolean): void {
  let json: Record<string, unknown> = {};
  if (existsSync(file)) json = JSON.parse(readFileSync(file, "utf8"));
  if (!json.version) json.version = 1;
  const hooks = (json.hooks as Record<string, unknown[]>) ?? {};
  const list = hooks[key] ?? [];
  const marker = JSON.stringify(entry);
  if (!list.some((x) => JSON.stringify(x) === marker)) list.push(entry as never);
  hooks[key] = list;
  json.hooks = hooks;
  if (!dry) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  }
}

function writeFile(file: string, content: string, dry: boolean, written: string[]): void {
  written.push(file);
  if (dry) return;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

export async function install(opts: CommonOpts): Promise<void> {
  readOrCreateState.reset();
  const scope = await resolveScope(opts);
  const tools = resolveTools(scope, { ...opts, cwd: opts.cwd });
  const items = itemsForInstall(scope, opts);
  const dry = Boolean(opts.dryRun);
  const written: string[] = [];
  const paste: string[] = [];
  let tokenText = "";

  for (const tool of tools) {
    const paths = toolPaths(tool, scope, opts.cwd);
    for (const sel of items) {
      if (!sel.item.tools.includes(tool)) {
        console.log(`skip ${sel.pack}:${sel.item.id} (not for ${tool})`);
        continue;
      }
      const key = `${sel.pack}:${sel.item.id}`;
      if (sel.item.kind === "skill") {
        const dest = path.join(paths.skills, sel.item.id);
        const existing = listSkillNamesOnDisk(paths.skills);
        const from = skillDir(sel);
        if (existing.includes(sel.item.id) && !existsSync(path.join(dest, ".packfuse"))) {
          console.log(`skip ${key} (already installed as ${sel.item.id})`);
          continue;
        }
        const md = skillMarkdown(sel, tool);
        tokenText += md.slice(0, md.indexOf("\n---", 4) + 4) + "\n";
        writeFile(path.join(dest, "SKILL.md"), md, dry, written);
        if (!dry) {
          writeFileSync(path.join(dest, ".packfuse"), key);
          copySkillExtras(from, dest, written);
        }
        addStatePath(readOrCreateState.cache(scope, opts.cwd), tool, path.join(dest, "SKILL.md"), key);
      } else if (sel.item.kind === "rule") {
        const r = ruleMarkdown(sel, tool);
        tokenText += r.body + "\n";
        if (tool === "cursor" && paths.userRulesPaste) {
          paste.push(`# ${sel.pack}:${sel.item.id}\n${r.body}`);
          continue;
        }
        if (tool === "cursor") {
          const f = path.join(paths.rules, `${sel.item.id}.mdc`);
          writeFile(f, cursorMdc(sel), dry, written);
          addStatePath(readOrCreateState.cache(scope, opts.cwd), tool, f, key);
        } else if (r.globs && tool === "claude") {
          const f = path.join(paths.rules, `${sel.item.id}.md`);
          writeFile(f, `# ${r.description}\n\n${r.body}\n`, dry, written);
          addStatePath(readOrCreateState.cache(scope, opts.cwd), tool, f, key);
        } else if (paths.ruleFile) {
          const prev = existsSync(paths.ruleFile) ? readFileSync(paths.ruleFile, "utf8") : "";
          const next = upsertMarked(prev, sel.pack, sel.item.id, r.body);
          writeFile(paths.ruleFile, next, dry, written);
          addStatePath(readOrCreateState.cache(scope, opts.cwd), tool, paths.ruleFile, key);
        }
      } else if (sel.item.kind === "agent") {
        if (tool === "codex") {
          const f = path.join(paths.agents, `${sel.item.id}.toml`);
          writeFile(f, agentCodexToml(sel), dry, written);
          addStatePath(readOrCreateState.cache(scope, opts.cwd), tool, f, key);
        } else {
          const f = path.join(paths.agents, `${sel.item.id}.md`);
          writeFile(f, agentCursorClaude(sel), dry, written);
          addStatePath(readOrCreateState.cache(scope, opts.cwd), tool, f, key);
        }
      } else if (sel.item.kind === "hook") {
        if (!paths.hooks) {
          console.log(`skip ${key} hook (no mapping for ${tool})`);
          continue;
        }
        const scriptSrc = hookScript(sel);
        const scriptDest = path.join(paths.hookScripts ?? path.dirname(paths.hooks), `${sel.item.id}.mjs`);
        if (existsSync(scriptSrc)) {
          writeFile(scriptDest, readFileSync(scriptSrc, "utf8"), dry, written);
        }
        const entry = {
          command: scriptDest,
          packfuse: key,
        };
        if (tool === "cursor") {
          mergeJsonHook(paths.hooks, sel.item.id, { command: scriptDest }, dry);
          written.push(paths.hooks);
        } else if (tool === "claude") {
          mergeClaudeHook(paths.hooks, sel.item.id, scriptDest, dry);
          written.push(paths.hooks);
        }
        addStatePath(readOrCreateState.cache(scope, opts.cwd), tool, paths.hooks, key);
      }
    }
  }

  const state = readOrCreateState.cache(scope, opts.cwd);
  const lock = readLock(scope, opts.cwd);
  for (const sel of items) {
    addLockItem(lock, sel.pack, sel.item.id, sel.item.version, sel.item.priority);
  }
  if (!dry) {
    writeLock(scope, lock, opts.cwd);
    writeState(scope, state, opts.cwd);
  }

  const tokens = estimateTokens(tokenText);
  console.log(dry ? "dry-run (estimate, tiktoken cl100k-compatible gpt-4 encoding)" : "installed");
  console.log(`scope=${scope} tools=${tools.join(",")}`);
  console.log(`items=${items.map((x) => `${x.pack}:${x.item.id}`).join(", ") || "(none)"}`);
  console.log(`files=${written.length}`);
  console.log(`estimated always-on tokens=${tokens}`);
  if (scope === "home") console.log("Note: hooks installed with --home apply to every repository.");
  if (paste.length) {
    console.log("\nPaste into Cursor Customize → User Rules:\n");
    console.log(paste.join("\n\n"));
  }
}

const readOrCreateState = {
  _cache: null as ReturnType<typeof readState> | null,
  cache(scope: Scope, cwd?: string) {
    if (!this._cache) this._cache = readState(scope, cwd);
    return this._cache;
  },
  reset() {
    this._cache = null;
  },
};

function mergeClaudeHook(file: string, event: string, command: string, dry: boolean): void {
  let json: Record<string, unknown> = {};
  if (existsSync(file)) json = JSON.parse(readFileSync(file, "utf8"));
  const map: Record<string, string> = {
    beforeShellExecution: "PreToolUse",
    afterFileEdit: "PostToolUse",
    sessionEnd: "Stop",
  };
  const claudeEvent = map[event] ?? event;
  const hooks = (json.hooks as Record<string, unknown[]>) ?? {};
  const list = (hooks[claudeEvent] as unknown[]) ?? [];
  const entry = { matcher: event === "beforeShellExecution" ? "Bash" : "", hooks: [{ type: "command", command }] };
  if (!JSON.stringify(list).includes(command)) list.push(entry);
  hooks[claudeEvent] = list;
  json.hooks = hooks;
  if (!dry) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  }
}

export async function uninstall(opts: CommonOpts): Promise<void> {
  const scope = await resolveScope(opts);
  if (!opts.tool && !opts.all) throw new Error("uninstall requires --tool or --all");
  const tools = opts.all
    ? (Object.keys(readState(scope, opts.cwd)) as Tool[])
    : resolveTools(scope, opts);
  const state = readState(scope, opts.cwd);
  const lock = readLock(scope, opts.cwd);
  const targets = opts.item
    ? [`${opts.pack}:${opts.item}`]
    : opts.pack
      ? lock.items.filter((x) => x.pack === opts.pack).map((x) => `${x.pack}:${x.id}`)
      : lock.items.map((x) => `${x.pack}:${x.id}`);

  for (const tool of tools) {
    for (const key of targets) {
      const [pack, id] = key.split(":");
      const paths = (state[tool]?.paths ?? []).filter((p) => p.includes(id) || p.endsWith("CLAUDE.md") || p.endsWith("AGENTS.md"));
      for (const p of paths) {
        if (p.endsWith("CLAUDE.md") || p.endsWith("AGENTS.md")) {
          if (existsSync(p)) writeFileSync(p, removeMarked(readFileSync(p, "utf8"), pack, id));
        } else if (p.endsWith("SKILL.md")) {
          rmSync(path.dirname(p), { recursive: true, force: true });
        } else if (existsSync(p) && (p.endsWith(".mdc") || p.endsWith(".md") || p.endsWith(".toml") || p.endsWith(".mjs"))) {
          rmSync(p, { force: true });
        }
      }
      removeStateItem(state, tool, key, paths);
    }
  }
  for (const key of targets) {
    const [pack, id] = key.split(":");
    if (!itemStillInstalled(state, key)) removeLockItem(lock, pack, id);
  }
  writeState(scope, state, opts.cwd);
  writeLock(scope, lock, opts.cwd);
  console.log(`uninstalled ${targets.join(", ")} from ${tools.join(",")}`);
}

export async function update(opts: CommonOpts): Promise<void> {
  const scope = await resolveScope(opts);
  const lock = readLock(scope, opts.cwd);
  opts.pack = undefined;
  opts.item = undefined;
  if (!lock.items.length) {
    console.log("nothing in lock");
    return;
  }
  await install({ ...opts, pack: undefined, item: undefined });
}

export async function listCmd(opts: CommonOpts): Promise<void> {
  const scope = opts.home || opts.project || opts.scope ? await resolveScope(opts) : null;
  console.log("available:");
  for (const x of allItems()) {
    console.log(`  ${x.pack}:${x.item.id} ${x.item.kind} ${x.item.priority} [${x.item.tools.join(",")}]`);
  }
  if (scope) {
    const lock = readLock(scope, opts.cwd);
    console.log(`installed (${scope}):`);
    for (const i of lock.items) console.log(`  ${i.pack}:${i.id}@${i.version}`);
  }
}

export async function doctor(opts: CommonOpts): Promise<void> {
  const scopes: Scope[] = ["home", "project"];
  const autoP0 = allItems().filter((x) => x.pack === "general" && x.item.priority === "p0" && x.item.invoke === "auto" && x.item.kind === "skill");
  for (const scope of scopes) {
    const lock = readLock(scope, opts.cwd);
    const state = readState(scope, opts.cwd);
    console.log(`--- ${scope} ---`);
    for (const item of lock.items) {
      const key = `${item.pack}:${item.id}`;
      const inState = itemStillInstalled(state, key);
      if (!inState) console.log(`lock/state mismatch: ${key} in lock, missing in state`);
    }
    const homeSkills = listSkillNamesOnDisk(toolPaths("cursor", "home", opts.cwd).skills);
    const projSkills = listSkillNamesOnDisk(toolPaths("cursor", "project", opts.cwd).skills);
    for (const n of homeSkills) {
      if (projSkills.includes(n)) console.log(`duplicate skill ${n} in home and project`);
    }
    for (const skill of autoP0) {
      const name = skill.item.id;
      const anywhere = ["cursor", "claude", "codex"].some((t) => {
        const p = toolPaths(t as Tool, scope, opts.cwd);
        return listSkillNamesOnDisk(p.skills).includes(name);
      });
      if (!anywhere && lock.items.some((x) => x.id === name)) {
        const onDisk = ["cursor", "claude", "codex"].some((t) =>
          listSkillNamesOnDisk(toolPaths(t as Tool, scope, opts.cwd).skills).includes(name),
        );
        if (!onDisk) {
          const foreign = ["cursor", "claude", "codex"].some((t) =>
            listSkillNamesOnDisk(toolPaths(t as Tool, scope, opts.cwd).skills).includes(name),
          );
          if (!foreign) console.log(`loop skill missing: ${name}`);
        }
      } else if (anywhere && !lock.items.some((x) => x.id === name)) {
        console.log(`already installed, skipped: ${name}`);
      }
    }
  }
}

export function resetStateCache(): void {
  readOrCreateState.reset();
}
