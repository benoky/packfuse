export type Kind = "skill" | "rule" | "agent" | "hook";
export type Priority = "p0" | "p1" | "p2";
export type Invoke = "auto" | "slash";
export type Tool = "cursor" | "claude" | "codex";

export interface ItemRelay {
  source: string;
  skill?: string;
}

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
  relay?: ItemRelay;
}

export interface PackRelay {
  source: string;
  skills: string[];
}

export interface PackManifest {
  id: string;
  version: string;
  items: ManifestItem[];
  relay?: PackRelay;
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
  /** Packs installed by an external installer. `update` runs that installer again. */
  relays?: string[];
  /** Official skill names Packfuse installed, per relay pack and tool. Missing entries are not owned. */
  relayOwned?: Record<string, Partial<Record<Tool, string[]>>>;
}

export interface Installation {
  version: string;
  files: string[];
  blockFile?: string;
  hook?: { file: string; event: string; command: string; legacyCommand?: string };
  external?: boolean;
  manual?: boolean;
}

export interface ToolState {
  paths: string[];
  items: string[];
  installations?: Record<string, Installation>;
}

export interface StateFile {
  [tool: string]: ToolState;
}

export interface SelectedItem {
  pack: string;
  item: ManifestItem;
  packDir: string;
}
