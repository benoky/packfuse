import { existsSync, readFileSync } from "node:fs";
import type { LockFile, StateFile, Tool } from "./types.js";
import { lockPath, statePath, type Scope } from "./paths.js";

const tools: Tool[] = ["cursor", "claude", "codex"];

function isRelayOwned(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const [pack, byTool] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(pack) || !byTool || typeof byTool !== "object" || Array.isArray(byTool)) {
      return false;
    }
    for (const [tool, skills] of Object.entries(byTool as Record<string, unknown>)) {
      if (!tools.includes(tool as Tool) || !Array.isArray(skills) ||
        skills.some((skill) => typeof skill !== "string" || !/^[a-z0-9-]+$/.test(skill))) {
        return false;
      }
    }
  }
  return true;
}

export function readLock(scope: Scope, cwd?: string): LockFile {
  const p = lockPath(scope, cwd);
  if (!existsSync(p)) return { items: [] };
  const value = JSON.parse(readFileSync(p, "utf8"));
  if (!value || !Array.isArray(value.items) || value.items.some((i: any) =>
    !i || typeof i.pack !== "string" || typeof i.id !== "string" || typeof i.version !== "string") ||
    (value.relays !== undefined && (!Array.isArray(value.relays) || value.relays.some((id: unknown) => typeof id !== "string"))) ||
    !isRelayOwned(value.relayOwned)) {
    throw new Error(`Invalid lock: ${p}`);
  }
  return value;
}

export function readState(scope: Scope, cwd?: string): StateFile {
  const p = statePath(scope, cwd);
  if (!existsSync(p)) return {};
  const value = JSON.parse(readFileSync(p, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid state: ${p}`);
  for (const [tool, entry] of Object.entries(value) as [string, any][]) {
    if (!["cursor", "claude", "codex"].includes(tool) || !entry ||
      !Array.isArray(entry.items) || !entry.items.every((x: unknown) => typeof x === "string") ||
      !Array.isArray(entry.paths) || !entry.paths.every((x: unknown) => typeof x === "string")) {
      throw new Error(`Invalid state for ${tool}: ${p}`);
    }
    if (entry.installations) for (const record of Object.values(entry.installations) as any[]) {
      if (!record || typeof record.version !== "string" || !Array.isArray(record.files) ||
        !record.files.every((x: unknown) => typeof x === "string")) throw new Error(`Invalid installation: ${p}`);
    }
  }
  return value;
}

export function addLockItem(lock: LockFile, pack: string, id: string, version: string, priority: LockFile["items"][0]["priority"]): void {
  const index = lock.items.findIndex((x) => x.pack === pack && x.id === id);
  const item = { pack, id, version, priority };
  if (index >= 0) lock.items[index] = item;
  else lock.items.push(item);
}

export function itemStillInstalled(state: StateFile, key: string): boolean {
  return Object.values(state).some((entry) => entry.items.includes(key));
}
