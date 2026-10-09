import { chmodSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

interface Backup { body: Buffer; mode: number }
function statIfPresent(file: string) {
  try { return lstatSync(file); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** Preflight all destinations, then roll back ordinary write failures. Not crash-atomic. */
export class FileTransaction {
  readonly changes = new Map<string, string | Buffer | null>();
  read(file: string): string {
    const resolved = path.resolve(file);
    if (this.changes.has(resolved)) return this.changes.get(resolved)?.toString() ?? "";
    return statIfPresent(resolved) ? readFileSync(resolved, "utf8") : "";
  }
  write(file: string, body: string | Buffer): void { this.changes.set(path.resolve(file), body); }
  remove(file: string): void { this.changes.set(path.resolve(file), null); }
  commit(): void {
    const backups = new Map<string, Backup | null>();
    const createdDirs: string[] = [];
    for (const file of this.changes.keys()) {
      // Validate ancestors first: ENOTDIR at a leaf must be caught before any writes.
      const ancestors: string[] = [];
      for (let p = path.dirname(file); ; p = path.dirname(p)) {
        ancestors.push(p);
        if (p === path.dirname(p)) break;
      }
      for (const p of ancestors.reverse()) {
        const stat = statIfPresent(p);
        if (stat?.isSymbolicLink()) throw new Error(`Refusing symlink destination: ${p}`);
        if (stat && !stat.isDirectory()) throw new Error(`Not a directory: ${p}`);
      }
      const stat = statIfPresent(file);
      if (stat?.isSymbolicLink()) throw new Error(`Refusing symlink destination: ${file}`);
      if (stat && !stat.isFile()) throw new Error(`Not a regular file: ${file}`);
      backups.set(file, stat ? { body: readFileSync(file), mode: stat.mode & 0o7777 } : null);
    }
    const modified: string[] = [];
    const replace = (file: string, body: string | Buffer, mode?: number, changed?: () => void) => {
      const missing: string[] = [];
      for (let p = path.dirname(file); !statIfPresent(p); p = path.dirname(p)) missing.push(p);
      for (const dir of missing.reverse()) { mkdirSync(dir); createdDirs.push(dir); }
      const temp = `${file}.packfuse-${randomUUID()}.tmp`;
      try {
        writeFileSync(temp, body, { flag: "wx", ...(mode === undefined ? {} : { mode }) });
        // chmod restores bits that umask may have removed at creation time.
        if (mode !== undefined) chmodSync(temp, mode);
        renameSync(temp, file);
        changed?.();
      } finally { rmSync(temp, { force: true }); }
    };
    try {
      for (const [file, body] of this.changes) {
        if (body === null) {
          rmSync(file, { force: true });
          modified.push(file);
        } else replace(file, body, backups.get(file)?.mode, () => modified.push(file));
      }
    } catch (error) {
      const recoveryErrors: Error[] = [];
      for (const file of modified.reverse()) {
        try {
          const backup = backups.get(file)!;
          if (backup === null) rmSync(file, { force: true });
          else replace(file, backup.body, backup.mode);
        } catch (recoveryError) {
          recoveryErrors.push(new Error(`Failed to restore ${file}`, { cause: recoveryError }));
        }
      }
      for (const dir of [...new Set(createdDirs)].reverse()) {
        try { rmdirSync(dir); }
        catch (cleanupError) {
          if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes((cleanupError as NodeJS.ErrnoException).code ?? "")) {
            recoveryErrors.push(new Error(`Failed to clean up ${dir}`, { cause: cleanupError }));
          }
        }
      }
      if (recoveryErrors.length) {
        throw new AggregateError([error, ...recoveryErrors],
          `Transaction failed; rollback incomplete: ${recoveryErrors.map((e) => e.message).join("; ")}`,
          { cause: error });
      }
      throw error;
    }
  }
}
