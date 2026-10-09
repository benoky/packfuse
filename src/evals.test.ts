import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

test("eval graders reject broken baselines and accept reference repairs", () => {
  const result = spawnSync(process.execPath, ["evals/run.mjs", "--self-test"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal((result.stdout.match(/reference repair passes/g) ?? []).length, 7);
});
test("eval prepare/grade records failures without inventing model evidence", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "packfuse-eval-test-"));
  const out = path.join(tmp, "runs");
  try {
    const prepare = spawnSync(process.execPath, ["evals/run.mjs", "--prepare", "--out", out, "--mode", "baseline", "--tool", "cursor", "--model", "test-fixture-not-a-model-run", "--repeats", "1"], { encoding: "utf8" });
    assert.equal(prepare.status, 0, prepare.stderr);
    const grade = spawnSync(process.execPath, ["evals/run.mjs", "--grade", "--out", out], { encoding: "utf8" });
    assert.equal(grade.status, 1);
    const results = JSON.parse(readFileSync(path.join(out, "results.json"), "utf8")).results;
    assert.equal(results.length, 7);
    assert.ok(results.every((r: any) => !r.passed && r.changedFiles.length === 0 && r.reportedEvidence.tokens === null));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("eval refuses success when a submission exits before assertions finish", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "packfuse-eval-exit-"));
  const out = path.join(tmp, "runs");
  try {
    const prepare = spawnSync(process.execPath, ["evals/run.mjs", "--prepare", "--out", out, "--mode", "baseline", "--tool", "cursor", "--model", "regression-fixture", "--repeats", "1"], { encoding: "utf8" });
    assert.equal(prepare.status, 0, prepare.stderr);
    writeFileSync(path.join(out, "ci-fix-1", "work", "app.mjs"), "process.exit(0);\n");
    const grade = spawnSync(process.execPath, ["evals/run.mjs", "--grade", "--out", out], { encoding: "utf8" });
    assert.equal(grade.status, 1);
    const result = JSON.parse(readFileSync(path.join(out, "results.json"), "utf8")).results.find((r: any) => r.task === "ci-fix");
    assert.equal(result.exitCode, 0); assert.equal(result.passed, false); assert.equal(result.completed, false);
    assert.match(result.error, /did not complete/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
