import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ManifestItem, PackIndex, PackManifest, SelectedItem } from "./types.js";

export function packageRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  if (path.basename(here) === "src") return path.join(here, "..");
  return path.join(here, "..");
}

export function packsDir(): string {
  return path.join(packageRoot(), "packs");
}

export function loadIndex(): PackIndex {
  return JSON.parse(readFileSync(path.join(packsDir(), "index.json"), "utf8")) as PackIndex;
}

export function loadPack(id: string): PackManifest {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`Invalid pack id ${id}`);
  const manifest = JSON.parse(readFileSync(path.join(packsDir(), id, "manifest.json"), "utf8")) as PackManifest;
  if (manifest.id !== id || !Array.isArray(manifest.items)) throw new Error(`Invalid manifest ${id}`);
  if (manifest.relay !== undefined) {
    const relay = manifest.relay;
    if (!relay || typeof relay.source !== "string" || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(relay.source) ||
      !Array.isArray(relay.skills) || !relay.skills.length || relay.skills.some((skill) => !/^[a-z0-9-]+$/.test(skill))) {
      throw new Error(`Invalid relay ${id}`);
    }
  }
  const seen = new Set<string>();
  for (const item of manifest.items) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(item.id) || seen.has(item.id) ||
      !["skill", "rule", "agent", "hook"].includes(item.kind) || !["p0", "p1", "p2"].includes(item.priority) ||
      !Array.isArray(item.tools) || !item.tools.length || item.tools.some((t) => !["cursor", "claude", "codex"].includes(t)) ||
      typeof item.version !== "string" || !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(item.version) ||
      typeof item.source !== "string" || (item.kind === "skill" && !["auto", "slash"].includes(item.invoke!)) ||
      (item.requires !== undefined && (!Array.isArray(item.requires) || item.requires.some((r) => !/^[a-z0-9-]+:[a-zA-Z0-9-]+$/.test(r))))) {
      throw new Error(`Invalid manifest item ${id}:${item.id}`);
    }
    seen.add(item.id);
  }
  return manifest;
}

export function allItems(): SelectedItem[] {
  const out: SelectedItem[] = [];
  for (const pack of loadIndex().packs) {
    const manifest = loadPack(pack);
    const packDir = path.join(packsDir(), pack);
    for (const item of manifest.items) {
      out.push({ pack, item, packDir });
    }
  }
  return out;
}

export function findItem(pack: string, id: string): SelectedItem {
  const found = allItems().find((x) => x.pack === pack && x.item.id === id);
  if (!found) throw new Error(`Unknown item ${pack}:${id}`);
  return found;
}

export function resolveRequires(seed: SelectedItem[], all = allItems()): SelectedItem[] {
  const map = new Map(all.map((x) => [`${x.pack}:${x.item.id}`, x]));
  const out = new Map<string, SelectedItem>();
  const visiting = new Set<string>();
  function visit(cur: SelectedItem): void {
    const key = `${cur.pack}:${cur.item.id}`;
    if (visiting.has(key)) throw new Error(`Circular requires: ${[...visiting, key].join(" -> ")}`);
    if (out.has(key)) return;
    visiting.add(key);
    for (const req of cur.item.requires ?? []) {
      const next = map.get(req);
      if (!next) throw new Error(`Missing requires ${req} from ${key}`);
      visit(next);
    }
    visiting.delete(key);
    out.set(key, cur);
  }
  seed.forEach(visit);
  return [...out.values()];
}

export function filterByPriority(items: SelectedItem[], max: "p0" | "p1" | "p2"): SelectedItem[] {
  const order = { p0: 0, p1: 1, p2: 2 };
  return items.filter((x) => order[x.item.priority] <= order[max]);
}

export function skillDir(sel: SelectedItem): string {
  return path.join(sel.packDir, "skills", sel.item.id);
}

export function ruleFile(sel: SelectedItem): string {
  return path.join(sel.packDir, "rules", `${sel.item.id}.md`);
}

export function agentFile(sel: SelectedItem): string {
  return path.join(sel.packDir, "agents", `${sel.item.id}.md`);
}

export function hookDir(sel: SelectedItem): string {
  return path.join(sel.packDir, "hooks", sel.item.id);
}

export function listSkillNamesOnDisk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(dir, d.name, "SKILL.md")))
    .map((d) => d.name);
}
