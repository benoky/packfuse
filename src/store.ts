import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { LockFile, StateFile } from "./types.js";
import { lockPath, statePath, type Scope } from "./paths.js";

export function readLock(scope: Scope, cwd?: string): LockFile {
  const p = lockPath(scope, cwd);
  if (!existsSync(p)) return { items: [] };
  return JSON.parse(readFileSync(p, "utf8")) as LockFile;
}

export function writeLock(scope: Scope, lock: LockFile, cwd?: string): string {
  const p = lockPath(scope, cwd);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(lock, null, 2) + "\n");
  return p;
}

export function readState(scope: Scope, cwd?: string): StateFile {
  const p = statePath(scope, cwd);
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, "utf8")) as StateFile;
}

export function writeState(scope: Scope, state: StateFile, cwd?: string): string {
  const p = statePath(scope, cwd);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(state, null, 2) + "\n");
  return p;
}

export function addLockItem(lock: LockFile, pack: string, id: string, version: string, priority: LockFile["items"][0]["priority"]): void {
  const i = lock.items.findIndex((x) => x.pack === pack && x.id === id);
  const item = { pack, id, version, priority };
  if (i >= 0) lock.items[i] = item;
  else lock.items.push(item);
}

export function removeLockItem(lock: LockFile, pack: string, id: string): void {
  lock.items = lock.items.filter((x) => !(x.pack === pack && x.id === id));
}

export function addStatePath(state: StateFile, tool: string, file: string, itemKey: string): void {
  if (!state[tool]) state[tool] = { paths: [], items: [] };
  if (!state[tool].paths.includes(file)) state[tool].paths.push(file);
  if (!state[tool].items.includes(itemKey)) state[tool].items.push(itemKey);
}

export function removeStateItem(state: StateFile, tool: string, itemKey: string, paths: string[]): void {
  if (!state[tool]) return;
  state[tool].items = state[tool].items.filter((x) => x !== itemKey);
  for (const p of paths) {
    state[tool].paths = state[tool].paths.filter((x) => x !== p);
  }
  if (!state[tool].items.length && !state[tool].paths.length) delete state[tool];
}

export function itemStillInstalled(state: StateFile, itemKey: string): boolean {
  return Object.values(state).some((t) => t.items.includes(itemKey));
}
