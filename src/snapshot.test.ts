import { mkdtempSync, rmSync, existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { install, resetStateCache } from "./engine.js";

const cwd = mkdtempSync(path.join(os.tmpdir(), "packfuse-"));
try {
  resetStateCache();
  await install({ project: true, tool: "cursor", dryRun: true, cwd });
  resetStateCache();
  await install({ project: true, tool: "cursor", cwd });
  const skills = path.join(cwd, ".cursor", "skills");
  if (!existsSync(path.join(skills, "implement-change", "SKILL.md"))) {
    throw new Error("missing implement-change");
  }
  if (!existsSync(path.join(cwd, ".cursor", "rules", "safety.mdc"))) {
    throw new Error("missing safety rule");
  }
  if (!existsSync(path.join(cwd, ".packfuse", "lock.json"))) {
    throw new Error("missing lock");
  }
  const names = readdirSync(skills);
  if (!names.includes("implement-change")) throw new Error("skills not listed");
  console.log("snapshot ok", names.length, "skills");
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
