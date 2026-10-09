// Best-effort guard for common destructive commands; not a shell parser or security sandbox.
let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw); } catch { console.error("packfuse: expected JSON hook input"); process.exit(2); }
const command = input.tool_input?.command ?? input.command;
if (typeof command !== "string") { console.error("packfuse: missing command"); process.exit(2); }
const claude = process.argv.includes("claude") || input.hook_event_name === "PreToolUse";
const deny = [
  /\bgit\b[^\n;&|]*\bpush\b[^\n;&|]*(?:--force(?:-with-lease)?\b|(?:^|\s)-[a-zA-Z]*f[a-zA-Z]*(?:\s|$))/,
  /\brm\s+(?:-[a-zA-Z]+\s+)+["']?\/(?:["']?(?:\s|$|[;&|]))/,
  /\bmkfs(?:\.[a-z0-9]+)?\b/,
  /\bdd\b[^\n;&|]*\bof=\/dev\//,
].some((re) => re.test(command));
if (deny) {
  const reason = "packfuse: destructive command blocked; review and run manually if intended";
  console.log(JSON.stringify(claude
    ? { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }
    : { permission: "deny", user_message: reason, agent_message: reason }));
} else if (!claude) console.log(JSON.stringify({ permission: "allow" }));
// Claude: no decision on ordinary commands, retaining the host's normal permission flow.
