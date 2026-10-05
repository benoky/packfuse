const fs = await import("node:fs");
let input = "";
if (process.stdin.isTTY) process.exit(0);
for await (const chunk of process.stdin) input += chunk;
let cmd = input;
try { cmd = JSON.stringify(JSON.parse(input)); } catch {}
const deny = [/git\s+push\s+.*--force/, /rm\s+-rf\s+\/( |$)/, /mkfs\./];
if (deny.some((r) => r.test(cmd))) {
  console.error("packfuse: blocked destructive command");
  process.exit(2);
}
process.exit(0);
