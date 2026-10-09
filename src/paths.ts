import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export type Tool = "cursor" | "claude" | "codex";
export type Scope = "home" | "project";

export function homeDir(): string {
  return os.homedir();
}

export function projectDir(cwd = process.cwd()): string {
  return path.resolve(cwd);
}

export function packfuseDir(scope: Scope, cwd?: string): string {
  return scope === "home"
    ? path.join(homeDir(), ".packfuse")
    : path.join(projectDir(cwd), ".packfuse");
}

export function lockPath(scope: Scope, cwd?: string): string {
  return path.join(packfuseDir(scope, cwd), "lock.json");
}

export function statePath(scope: Scope, cwd?: string): string {
  return path.join(packfuseDir(scope, cwd), "state.json");
}

export function toolPaths(tool: Tool, scope: Scope, cwd?: string) {
  const home = homeDir();
  const root = projectDir(cwd);
  if (tool === "cursor") {
    const base = scope === "home" ? path.join(home, ".cursor") : path.join(root, ".cursor");
    return {
      skills: path.join(base, "skills"),
      rules: path.join(base, "rules"),
      agents: path.join(base, "agents"),
      hooks: path.join(base, "hooks.json"),
      hookScripts: path.join(base, "hooks"),
      ruleFile: null as string | null,
      userRulesPaste: scope === "home",
    };
  }
  if (tool === "claude") {
    const base = scope === "home" ? path.join(home, ".claude") : path.join(root, ".claude");
    return {
      skills: path.join(base, "skills"),
      rules: path.join(base, "rules"),
      agents: path.join(base, "agents"),
      hooks: path.join(base, "settings.json"),
      hookScripts: path.join(base, "hooks"),
      ruleFile: scope === "home" ? path.join(base, "CLAUDE.md") : path.join(root, "CLAUDE.md"),
      userRulesPaste: false,
    };
  }
  const skills =
    scope === "home" ? path.join(home, ".agents", "skills") : path.join(root, ".agents", "skills");
  const agents =
    scope === "home" ? path.join(home, ".codex", "agents") : path.join(root, ".codex", "agents");
  const ruleFile =
    scope === "home" ? path.join(home, ".codex", "AGENTS.md") : path.join(root, "AGENTS.md");
  return {
    skills,
    rules: path.join(scope === "home" ? path.join(home, ".codex") : path.join(root, ".codex"), "rules"),
    agents,
    hooks: null as string | null,
    hookScripts: null as string | null,
    ruleFile,
    userRulesPaste: false,
  };
}

export function detectMarkers(scope: Scope, cwd?: string): Tool[] {
  const found: Tool[] = [];
  const home = homeDir();
  const root = projectDir(cwd);
  if (scope === "home") {
    if (existsSync(path.join(home, ".cursor"))) found.push("cursor");
    if (existsSync(path.join(home, ".claude"))) found.push("claude");
    if (existsSync(path.join(home, ".codex")) || existsSync(path.join(home, ".agents"))) {
      found.push("codex");
    }
  } else {
    if (existsSync(path.join(root, ".cursor"))) found.push("cursor");
    if (existsSync(path.join(root, ".claude"))) found.push("claude");
    if (existsSync(path.join(root, ".codex")) || existsSync(path.join(root, ".agents"))) {
      found.push("codex");
    }
  }
  return found;
}
