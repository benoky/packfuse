import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    allItems,
    packageRoot,
    resolveRequires,
    skillDir,
    ruleFile,
    agentFile,
    hookDir,
} from "./manifest.js";
import { parseMd } from "./convert.js";

export function validateCatalog(): string[] {
    const errors: string[] = [];
    const all = allItems();
    resolveRequires(all, all);
    const names = new Set<string>();
    const automatic = new Map<string, number>();
    for (const sel of all) {
        const { item, pack } = sel;
        if (item.relay) {
            if (item.kind !== "skill") errors.push(`Relay is only valid on skills: ${pack}:${item.id}`);
            if (item.invoke === "auto" && item.priority === "p0")
                automatic.set(pack, (automatic.get(pack) ?? 0) + 1);
            continue;
        }
        const file =
            item.kind === "skill"
                ? path.join(skillDir(sel), "SKILL.md")
                : item.kind === "rule"
                  ? ruleFile(sel)
                  : item.kind === "agent"
                    ? agentFile(sel)
                    : path.join(hookDir(sel), "run.mjs");
        if (!existsSync(file)) {
            errors.push(`Missing ${file}`);
            continue;
        }
        if (item.kind === "hook") continue;
        const { data, body } = parseMd(file);
        if (!body.trim()) errors.push(`Empty body: ${file}`);
        if (
            typeof data.description !== "string" ||
            !data.description.trim() ||
            data.description.length > 500
        )
            errors.push(`Invalid description: ${file}`);
        if (item.kind !== "skill") continue;
        if (data.name !== item.id || names.has(item.id))
            errors.push(`Invalid or duplicate name: ${file}`);
        names.add(item.id);
        if (item.invoke === "auto" && item.priority === "p0")
            automatic.set(pack, (automatic.get(pack) ?? 0) + 1);
        for (const match of readFileSync(file, "utf8").matchAll(
            /\]\(((?:references|scripts)\/[^)#]+)(?:#[^)]*)?\)/g,
        )) {
            if (!existsSync(path.join(skillDir(sel), match[1])))
                errors.push(`Broken local reference: ${file} -> ${match[1]}`);
        }
    }
    for (const [pack, count] of automatic)
        if (count > 8) errors.push(`${pack}: ${count} automatic P0 skills (max 8)`);
    return errors;
}

function listedPaths(value: unknown): string[] {
    if (typeof value === "string") return [value];
    if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) return value;
    return [];
}

export function validateCursorPlugin(): string[] {
    const errors: string[] = [];
    const root = packageRoot();
    if (existsSync(path.join(root, "plugin.json"))) {
        errors.push(
            "Root plugin.json belongs in the ChatGPT ZIP from pack:codex, not in this repository",
        );
    }
    const manifestPath = path.join(root, ".cursor-plugin", "plugin.json");
    if (!existsSync(manifestPath)) return ["Missing .cursor-plugin/plugin.json"];
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        name?: string;
        version?: string;
        description?: string;
        logo?: string;
        skills?: unknown;
        rules?: unknown;
        agents?: unknown;
        hooks?: unknown;
    };
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
        version: string;
    };
    if (manifest.name !== "packfuse") errors.push("Cursor plugin name must be packfuse");
    if (manifest.version !== pkg.version)
        errors.push("Cursor plugin version must match package.json");
    if (!manifest.description?.trim()) errors.push("Cursor plugin description is required");
    const skills = listedPaths(manifest.skills);
    const rules = listedPaths(manifest.rules);
    const agents = listedPaths(manifest.agents);
    const hooks = listedPaths(manifest.hooks);
    if (!skills.length || !rules.length || !agents.length || hooks.length !== 1) {
        errors.push("Cursor plugin must list skills, rules, agents, and one hooks file");
    }
    const declared = [
        ...skills,
        ...rules,
        ...agents,
        ...hooks,
        ...(manifest.logo ? [manifest.logo] : []),
    ];
    const resolved = new Map<string, string>();
    for (const entry of declared) {
        const normalized = entry.replaceAll("\\", "/");
        if (path.isAbsolute(entry) || normalized.split("/").includes("..")) {
            errors.push(`Unsafe Cursor plugin path: ${entry}`);
            continue;
        }
        const abs = path.resolve(root, entry);
        if (abs !== root && !abs.startsWith(root + path.sep))
            errors.push(`Cursor plugin path escapes the repository: ${entry}`);
        if (!existsSync(abs)) errors.push(`Missing Cursor plugin path: ${entry}`);
        resolved.set(entry, abs);
    }
    const skillRoots = new Set(
        skills
            .map((entry) => resolved.get(entry))
            .filter((entry): entry is string => Boolean(entry)),
    );
    const ruleRoots = new Set(
        rules
            .map((entry) => resolved.get(entry))
            .filter((entry): entry is string => Boolean(entry)),
    );
    const agentRoots = new Set(
        agents
            .map((entry) => resolved.get(entry))
            .filter((entry): entry is string => Boolean(entry)),
    );
    for (const sel of allItems()) {
        if (
            sel.item.kind === "skill" &&
            !sel.item.relay &&
            !skillRoots.has(path.resolve(path.dirname(skillDir(sel))))
        ) {
            errors.push(`Cursor plugin omits skill ${sel.pack}:${sel.item.id}`);
        }
        if (sel.item.kind === "rule" && !ruleRoots.has(path.resolve(path.dirname(ruleFile(sel))))) {
            errors.push(`Cursor plugin omits rule ${sel.pack}:${sel.item.id}`);
        }
        if (
            sel.item.kind === "agent" &&
            !agentRoots.has(path.resolve(path.dirname(agentFile(sel))))
        ) {
            errors.push(`Cursor plugin omits agent ${sel.pack}:${sel.item.id}`);
        }
    }
    const hooksFile = hooks[0] ? resolved.get(hooks[0]) : undefined;
    if (hooksFile && existsSync(hooksFile)) {
        const config = JSON.parse(readFileSync(hooksFile, "utf8")) as {
            hooks?: Record<string, { command?: string }[]>;
        };
        for (const sel of allItems().filter(
            (item) => item.item.kind === "hook" && item.item.tools.includes("cursor"),
        )) {
            const script = `./packs/${sel.pack}/hooks/${sel.item.id}/run.mjs`;
            const command = `node ${script}`;
            const entries = config.hooks?.[sel.item.id] ?? [];
            if (!entries.some((entry) => entry.command === command))
                errors.push(`Cursor hook command missing: ${command}`);
            if (!existsSync(path.resolve(root, script)))
                errors.push(`Cursor hook script missing: ${script}`);
        }
    }
    return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const errors = [...validateCatalog(), ...validateCursorPlugin()];
    errors.forEach((e) => console.error(e));
    console.log(`catalog: ${allItems().length} items, ${errors.length} error(s)`);
    if (errors.length) process.exitCode = 1;
}
