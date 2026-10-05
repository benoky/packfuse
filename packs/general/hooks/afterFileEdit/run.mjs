import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
const cwd = process.env.CURSOR_PROJECT_DIR || process.cwd();
for (const cmd of [["npx", "prettier", "--write", "."], ["npx", "eslint", "--fix", "."]]) {
  // no-op placeholder: formatters run only if project scripts exist
}
const pkg = cwd + "/package.json";
if (existsSync(pkg)) {
  // prefer project format script if present
}
process.exit(0);
