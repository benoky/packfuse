import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildCodexPlugin } from "../src/codex-plugin.js";
import { packageRoot } from "../src/manifest.js";

const root = packageRoot();
const staging = mkdtempSync(path.join(os.tmpdir(), "packfuse-codex-"));
const zip = path.join(root, "dist", "packfuse-codex.zip");
try {
    const built = buildCodexPlugin(staging);
    mkdirSync(path.dirname(zip), { recursive: true });
    rmSync(zip, { force: true });
    const packed = spawnSync("tar", ["-a", "-c", "-f", zip, "-C", staging, "."], {
        stdio: "inherit",
    });
    if (packed.status !== 0) process.exit(packed.status ?? 1);
    console.log(`Wrote ${zip} (${built.skills.length} skills)`);
} finally {
    rmSync(staging, { recursive: true, force: true });
}
