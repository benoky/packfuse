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
  return JSON.parse(
    readFileSync(path.join(packsDir(), id, "manifest.json"), "utf8"),
  ) as PackManifest;
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
  const stack = [...seed];
  while (stack.length) {
    const cur = stack.pop()!;
    const key = `${cur.pack}:${cur.item.id}`;
    if (out.has(key)) continue;
    out.set(key, cur);
    for (const req of cur.item.requires ?? []) {
      const next = map.get(req);
      if (!next) throw new Error(`Missing requires ${req} from ${key}`);
      stack.push(next);
    }
  }
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
