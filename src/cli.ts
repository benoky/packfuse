#!/usr/bin/env node
import { Command } from "commander";
import { doctor, install, listCmd, uninstall, update, type CommonOpts } from "./engine.js";

const program = new Command();
program.name("packfuse").description("Fuse skill packs onto Cursor, Claude Code, and Codex").version("1.0.0");

function scopeFlags(cmd: Command): Command {
  return cmd
    .option("--home", "user home")
    .option("--project", "current repository")
    .option("--scope <scope>", "home|project")
    .option("--tool <tool>", "cursor|claude|codex")
    .option("--cwd <dir>", "working directory");
}

scopeFlags(program.command("install").description("install or restore packs"))
  .option("--pack <id>")
  .option("--item <id>")
  .option("--priority <p>", "p0|p1|p2")
  .option("--dry-run")
  .action(async (opts: CommonOpts) => {
    await install(opts);
  });

scopeFlags(program.command("uninstall"))
  .option("--pack <id>")
  .option("--item <id>")
  .option("--all", "all tools in this scope")
  .action(async (opts: CommonOpts) => {
    await uninstall(opts);
  });

scopeFlags(program.command("update")).action(async (opts: CommonOpts) => {
  await update(opts);
});

scopeFlags(program.command("list")).action(async (opts: CommonOpts) => {
  await listCmd(opts);
});

scopeFlags(program.command("doctor")).action(async (opts: CommonOpts) => {
  await doctor(opts);
});

program.parseAsync().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
