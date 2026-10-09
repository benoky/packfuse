import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allItems, resolveRequires, skillDir, ruleFile, agentFile, hookDir } from "./manifest.js";
import { parseMd } from "./convert.js";

export function validateCatalog(): string[] {
  const errors: string[] = [];
  const all = allItems();
  resolveRequires(all, all);
  const names = new Set<string>();
  const automatic = new Map<string, number>();
  for (const sel of all) {
    const { item, pack } = sel;
    const file = item.kind === "skill" ? path.join(skillDir(sel), "SKILL.md") : item.kind === "rule" ? ruleFile(sel) : item.kind === "agent" ? agentFile(sel) : path.join(hookDir(sel), "run.mjs");
    if (!existsSync(file)) { errors.push(`Missing ${file}`); continue; }
    if (item.kind === "hook") continue;
    const { data, body } = parseMd(file);
    if (!body.trim()) errors.push(`Empty body: ${file}`);
    if (typeof data.description !== "string" || !data.description.trim() || data.description.length > 500) errors.push(`Invalid description: ${file}`);
    if (item.kind !== "skill") continue;
    if (data.name !== item.id || names.has(item.id)) errors.push(`Invalid or duplicate name: ${file}`);
    names.add(item.id);
    if (item.invoke === "auto" && item.priority === "p0") automatic.set(pack, (automatic.get(pack) ?? 0) + 1);
    for (const match of readFileSync(file, "utf8").matchAll(/\]\(((?:references|scripts)\/[^)#]+)(?:#[^)]*)?\)/g)) {
      if (!existsSync(path.join(skillDir(sel), match[1]))) errors.push(`Broken local reference: ${file} -> ${match[1]}`);
    }
  }
  for (const [pack, count] of automatic) if (count > 8) errors.push(`${pack}: ${count} automatic P0 skills (max 8)`);
  return errors;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateCatalog();
  errors.forEach((e) => console.error(e));
  console.log(`catalog: ${allItems().length} items, ${errors.length} error(s)`);
  if (errors.length) process.exitCode = 1;
}
