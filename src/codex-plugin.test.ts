import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import YAML from "yaml";
import { buildCodexPlugin } from "./codex-plugin.js";

test("codex plugin package contains skills only", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "packfuse-codex-test-"));
    try {
        const built = buildCodexPlugin(dir);
        const manifest = JSON.parse(readFileSync(path.join(dir, "plugin.json"), "utf8")) as {
            name: string;
            extensions: {
                "com.openai": {
                    interface: { displayName: string; shortDescription: string; logo: string };
                };
            };
        };
        assert.equal(manifest.name, "packfuse");
        assert.equal(manifest.extensions["com.openai"].interface.displayName, "Packfuse");
        assert.ok(manifest.extensions["com.openai"].interface.shortDescription.length <= 30);
        assert.equal(existsSync(path.join(dir, "hooks")), false);
        assert.equal(existsSync(path.join(dir, "assets", "logo.png")), true);
        assert.ok(built.skills.includes("brainstorming"));
        assert.ok(built.skills.includes("fix-ci"));
        assert.equal(built.skills.includes("docs-pdf"), false);
        const slash = YAML.parse(
            readFileSync(
                path.join(dir, "skills", "requesting-code-review", "agents", "openai.yaml"),
                "utf8",
            ),
        ) as {
            interface: { display_name: string };
            policy: { allow_implicit_invocation: boolean };
        };
        assert.equal(slash.interface.display_name.length > 0, true);
        assert.equal(slash.policy.allow_implicit_invocation, false);
        const auto = YAML.parse(
            readFileSync(path.join(dir, "skills", "fix-ci", "agents", "openai.yaml"), "utf8"),
        ) as {
            policy: { allow_implicit_invocation: boolean };
        };
        assert.equal(auto.policy.allow_implicit_invocation, true);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
