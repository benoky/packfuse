import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw); } catch { console.error("packfuse: expected JSON hook input"); process.exit(1); }
const rootValue = input.cwd ?? input.workspace_roots?.[0] ?? process.env.CURSOR_PROJECT_DIR ?? process.cwd();
const fileValue = input.tool_input?.file_path ?? input.file_path;
if (typeof rootValue !== "string" || typeof fileValue !== "string") process.exit(0);
const root = realpathSync(rootValue);
const candidate = path.resolve(root, fileValue);
if (!existsSync(candidate)) process.exit(0);
const file = realpathSync(candidate);
if (!file.startsWith(root + path.sep) || !statSync(file).isFile()) process.exit(0);
const relative = path.relative(root, file);
if (relative.split(path.sep).some((p) => ["node_modules", ".git", "dist", "build", "coverage"].includes(p))) process.exit(0);
// Explicit opt-in. Arguments are passed as an array; never run npx or download a formatter.
const configPath = path.join(root, "package.json");
if (!existsSync(configPath)) process.exit(0);
const config = JSON.parse(readFileSync(configPath, "utf8")).packfuse?.format;
if (!config) process.exit(0);
if (typeof config.script !== "string" || !Array.isArray(config.args) || !config.args.every((v) => typeof v === "string") || !config.args.includes("{file}")) {
  console.error("packfuse.format requires a local Node script and args containing {file}"); process.exit(1);
}
const script = realpathSync(path.resolve(root, config.script));
if (!script.startsWith(root + path.sep)) { console.error("packfuse: formatter script outside project"); process.exit(1); }
const result = spawnSync(process.execPath, [script, ...config.args.map((arg) => arg === "{file}" ? file : arg)], {
  cwd: root, encoding: "utf8", timeout: 30000, shell: false,
});
if (result.stdout) process.stderr.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
