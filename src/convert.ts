import { readFileSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { Tool } from "./types.js";
import type { SelectedItem } from "./types.js";
import { agentFile, hookDir, ruleFile, skillDir } from "./manifest.js";

export function parseMd(file: string): { data: Record<string, unknown>; body: string } {
  const raw = readFileSync(file, "utf8");
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { data: {}, body: raw };
  const fm = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  return { data: YAML.parse(fm) ?? {}, body };
}

export function skillMarkdown(sel: SelectedItem, tool: Tool): string {
  const { data, body } = parseMd(path.join(skillDir(sel), "SKILL.md"));
  const name = String(data.name ?? sel.item.id);
  const description = String(data.description ?? "");
  const slash = sel.item.invoke === "slash";
  const fields: string[] = [`name: ${name}`, `description: ${JSON.stringify(description)}`];
  if (slash && (tool === "cursor" || tool === "claude")) {
    fields.push("disable-model-invocation: true");
  }
  if (slash && tool === "codex") {
    fields.push("allow_implicit_invocation: false");
  }
  return `---\n${fields.join("\n")}\n---\n${body}`;
}

export function ruleMarkdown(sel: SelectedItem, tool: Tool): { always: boolean; globs?: string; body: string; description: string } {
  const { data, body } = parseMd(ruleFile(sel));
  const always = data.alwaysApply !== false;
  const globs = typeof data.globs === "string" ? data.globs : undefined;
  const description = String(data.description ?? sel.item.id);
  return { always, globs, body: body.trim(), description };
}

export function cursorMdc(sel: SelectedItem): string {
  const r = ruleMarkdown(sel, "cursor");
  const lines = [`description: ${r.description}`];
  if (r.globs) lines.push(`globs: ${r.globs}`);
  lines.push(`alwaysApply: ${r.always}`);
  return `---\n${lines.join("\n")}\n---\n\n${r.body}\n`;
}

export function markedBlock(pack: string, id: string, body: string): string {
  const start = `<!-- pack:${pack}:${id} -->`;
  const end = `<!-- /pack:${pack}:${id} -->`;
  return `${start}\n${body.trim()}\n${end}\n`;
}

export function upsertMarked(existing: string, pack: string, id: string, body: string): string {
  const start = `<!-- pack:${pack}:${id} -->`;
  const end = `<!-- /pack:${pack}:${id} -->`;
  const block = markedBlock(pack, id, body);
  const re = new RegExp(`${escapeRe(start)}[\\s\\S]*?${escapeRe(end)}\\n?`);
  if (re.test(existing)) return existing.replace(re, block);
  const trimmed = existing.replace(/\s*$/, "");
  return trimmed ? `${trimmed}\n\n${block}` : block;
}

export function removeMarked(existing: string, pack: string, id: string): string {
  const start = `<!-- pack:${pack}:${id} -->`;
  const end = `<!-- /pack:${pack}:${id} -->`;
  const re = new RegExp(`\\n*${escapeRe(start)}[\\s\\S]*?${escapeRe(end)}\\n?`);
  return existing.replace(re, "\n").replace(/\n{3,}/g, "\n\n").trimStart();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function agentMarkdown(sel: SelectedItem): { data: Record<string, unknown>; body: string } {
  return parseMd(agentFile(sel));
}

export function agentCursorClaude(sel: SelectedItem): string {
  const { data, body } = agentMarkdown(sel);
  const name = String(data.name ?? sel.item.id);
  const description = String(data.description ?? "");
  return `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n${body}`;
}

export function agentCodexToml(sel: SelectedItem): string {
  const { data, body } = agentMarkdown(sel);
  const name = String(data.name ?? sel.item.id);
  const description = String(data.description ?? "");
  const instructions = body.trim().replace(/\\/g, "\\\\").replace(/"""/g, '\\"""');
  return `name = "${name}"\ndescription = ${JSON.stringify(description)}\ndeveloper_instructions = """\n${instructions}\n"""\n`;
}

export function hookScript(sel: SelectedItem): string {
  return path.join(hookDir(sel), "run.mjs");
}
