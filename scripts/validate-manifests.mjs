import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const index = JSON.parse(readFileSync(path.join(root, "packs/index.json"), "utf8"));
const ids = new Set();
let autoP0 = {};
for (const pack of index.packs) {
  const m = JSON.parse(readFileSync(path.join(root, "packs", pack, "manifest.json"), "utf8"));
  autoP0[pack] = 0;
  for (const item of m.items) {
    const key = `${pack}:${item.id}`;
    if (ids.has(item.id)) throw new Error(`duplicate id ${item.id}`);
    ids.add(item.id);
    if (item.kind === "skill" && item.priority === "p0" && item.invoke === "auto") autoP0[pack]++;
    if (item.kind === "skill") {
      const skill = readFileSync(path.join(root, "packs", pack, "skills", item.id, "SKILL.md"), "utf8");
      const dm = skill.match(/^---\n([\s\S]*?)\n---/);
      if (!dm) throw new Error(`no frontmatter ${key}`);
      if (!skill.includes(`name: ${item.id}`)) throw new Error(`name mismatch ${key}`);
      const desc = skill.match(/description: (.*)/);
      const d = JSON.parse(desc[1]);
      if (d.length > 500) throw new Error(`description too long ${key}`);
    }
    for (const req of item.requires ?? []) {
      const [p, id] = req.split(":");
      const om = JSON.parse(readFileSync(path.join(root, "packs", p, "manifest.json"), "utf8"));
      if (!om.items.some((x) => x.id === id)) throw new Error(`missing requires ${req}`);
    }
  }
  if (autoP0[pack] > 8) throw new Error(`${pack} auto P0 ${autoP0[pack]}`);
}
console.log("manifests ok", [...ids].length, "items");
