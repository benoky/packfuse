export type Kind = "skill" | "rule" | "agent" | "hook";
export type Priority = "p0" | "p1" | "p2";
export type Invoke = "auto" | "slash";
export type Tool = "cursor" | "claude" | "codex";

export interface ManifestItem {
  id: string;
  kind: Kind;
  priority: Priority;
  tools: Tool[];
  invoke?: Invoke;
  requires?: string[];
  version: string;
  source: string;
  vendor?: string;
}

export interface PackManifest {
  id: string;
  version: string;
  items: ManifestItem[];
}

export interface PackIndex {
  packs: string[];
}

export interface LockItem {
  pack: string;
  id: string;
  version: string;
  priority: Priority;
}

export interface LockFile {
  items: LockItem[];
}

export interface StateFile {
  [tool: string]: { paths: string[]; items: string[] };
}

export interface SelectedItem {
  pack: string;
  item: ManifestItem;
  packDir: string;
}
