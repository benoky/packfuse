import {
    cpSync,
    existsSync,
    lstatSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { skillMarkdown } from "./convert.js";
import { allItems, packageRoot, skillDir } from "./manifest.js";
import type { SelectedItem } from "./types.js";

const logoName = "logo.png";

export function codexSkills(): SelectedItem[] {
    return allItems().filter(
        (sel) => sel.item.kind === "skill" && sel.item.tools.includes("codex"),
    );
}

export function buildCodexPlugin(outDir: string): { skills: string[] } {
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    const skills = codexSkills();
    const names = new Set<string>();
    for (const sel of skills) {
        const name = skillName(sel);
        const identity = `packfuse:${name}`;
        if (names.has(name)) throw new Error(`Duplicate Codex skill name ${name}`);
        if (identity.length > 64) throw new Error(`Codex skill identity too long: ${identity}`);
        names.add(name);
        const dest = path.join(outDir, "skills", name);
        copySkillFiles(skillDir(sel), dest);
        const markdown = skillMarkdown(sel, "codex");
        const description = frontmatterDescription(markdown);
        if (!description || description.length > 1024)
            throw new Error(`Codex skill description invalid: ${name}`);
        writeFileSync(path.join(dest, "SKILL.md"), markdown);
        writeFileSync(
            path.join(dest, "agents", "openai.yaml"),
            skillAgentYaml(sel, markdown, description),
        );
    }
    const logo = path.join(packageRoot(), "assets", logoName);
    const logoBytes = readFileSync(logo);
    const size = pngSize(logoBytes);
    if (size.width !== size.height || size.width < 48 || size.width > 4096) {
        throw new Error(`Codex logo must be a square PNG from 48 to 4096 pixels`);
    }
    mkdirSync(path.join(outDir, "assets"), { recursive: true });
    writeFileSync(path.join(outDir, "assets", logoName), logoBytes);
    writeFileSync(
        path.join(outDir, "plugin.json"),
        `${JSON.stringify(pluginManifest(), null, 2)}\n`,
    );
    return { skills: [...names].sort() };
}

function pluginManifest(): Record<string, unknown> {
    const pkg = JSON.parse(readFileSync(path.join(packageRoot(), "package.json"), "utf8")) as {
        version: string;
    };
    return {
        $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
        name: "packfuse",
        version: pkg.version,
        description:
            "Coding workflows for planning a change, fixing a bug, reviewing a diff, and checking the result.",
        author: { name: "benoky77", url: "https://github.com/benoky/packfuse" },
        homepage: "https://www.npmjs.com/package/packfuse",
        repository: "https://github.com/benoky/packfuse",
        license: "MIT",
        keywords: ["skills", "codex", "cursor", "claude"],
        extensions: {
            "com.openai": {
                interface: {
                    displayName: "Packfuse",
                    shortDescription: "Agent coding workflows",
                    longDescription:
                        "Packfuse gives a coding agent workflows for planning a change, implementing it, finding a bug, reviewing a diff, and checking the result before calling it done. This package contains those skills. Rules, agents, hooks, and the official document-skill installer are not included.",
                    developerName: "benoky77",
                    category: "Developer Tools",
                    capabilities: ["Planning", "Debugging", "Code review"],
                    websiteURL: "https://www.npmjs.com/package/packfuse",
                    defaultPrompt: "Plan a change, then implement and verify it.",
                    logo: "./assets/logo.png",
                    composerIcon: "./assets/logo.png",
                },
                onboardingSkill: "./skills/brainstorming/SKILL.md",
            },
        },
    };
}

function skillName(sel: SelectedItem): string {
    const raw = readFileSync(path.join(skillDir(sel), "SKILL.md"), "utf8");
    const name = /^name:\s*(\S+)\s*$/m.exec(raw)?.[1] ?? sel.item.id;
    if (name !== sel.item.id || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
        throw new Error(`Codex skill name must match its id: ${sel.pack}:${sel.item.id}`);
    }
    return name;
}

function frontmatterDescription(markdown: string): string {
    const match = /^description:\s*(.*)$/m.exec(markdown);
    if (!match) return "";
    return String(YAML.parse(match[1] ?? "") ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

function skillAgentYaml(sel: SelectedItem, markdown: string, description: string): string {
    const heading = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() || sel.item.id;
    return YAML.stringify({
        interface: {
            display_name: heading,
            short_description: description,
        },
        policy: {
            products: ["CHAT", "CODEX"],
            allow_implicit_invocation: sel.item.invoke !== "slash",
        },
    });
}

function copySkillFiles(src: string, dest: string): void {
    if (lstatSync(src).isSymbolicLink()) throw new Error(`Refusing symlink skill: ${src}`);
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src, { withFileTypes: true })) {
        if (entry.name === "SKILL.md" || entry.name === "agents") continue;
        const from = path.join(src, entry.name);
        if (entry.isSymbolicLink() || !existsSync(from))
            throw new Error(`Refusing symlink skill file: ${from}`);
        cpSync(from, path.join(dest, entry.name), { recursive: true, dereference: false });
    }
    mkdirSync(path.join(dest, "agents"), { recursive: true });
}

function pngSize(bytes: Buffer): { width: number; height: number } {
    if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG")
        throw new Error("Codex logo is not a PNG");
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
