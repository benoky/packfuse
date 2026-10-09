#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { tasks } from './tasks.mjs';

const args = process.argv.slice(2);
const get = (flag, fallback) => { const i = args.indexOf(flag); return i < 0 ? fallback : args[i + 1]; };
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const help = `Usage:
  node evals/run.mjs --prepare --out DIR --mode baseline|general|domain --tool cursor|claude|codex --model NAME [--repeats 3]
  node evals/run.mjs --grade --out DIR
  node evals/run.mjs --self-test
Preparation creates isolated tasks; it does not run or bill any model.
Run the selected model on each work/PROMPT.md, then grade. A passing grader checks behavior only.
`;
function write(file, text) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, text); }
function grade(task, work) {
  const completion = randomUUID();
  // A dedicated pipe records that all assertions finished, not merely a zero exit.
  const script = `import assert from 'node:assert/strict'; import {readFileSync,writeSync} from 'node:fs'; import path from 'node:path'; import{pathToFileURL}from'node:url'; const root=process.argv[1]; const load=n=>import(pathToFileURL(path.join(root,n)).href); const read=n=>readFileSync(path.join(root,n),'utf8'); ${task.checks}; writeSync(3, ${JSON.stringify(completion)});`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', script, work], {
    encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
  });
  const completed = r.output?.[3] === completion;
  const passed = r.status === 0 && completed;
  const diagnostic = r.error?.message ?? (r.stderr || '').slice(0, 4000);
  return { passed, completed, exitCode: r.status,
    error: diagnostic || (!completed ? 'Validation did not complete; exit status alone is insufficient.' : '') };
}

function changedFiles(dir, baseline) {
  const ignore = new Set(['.cursor', '.claude', '.codex', '.agents', '.packfuse', 'node_modules', '.git']);
  const files = [];
  function walk(current) {
    for (const e of readdirSync(current, { withFileTypes: true })) {
      if (ignore.has(e.name)) continue;
      const file = path.join(current, e.name);
      if (e.isDirectory()) walk(file);
      else if (e.isFile()) files.push(path.relative(dir, file).split(path.sep).join('/'));
    }
  }
  walk(dir);
  const excluded = new Set(['PROMPT.md', 'AGENTS.md', 'CLAUDE.md']);
  return [...new Set([...files, ...Object.keys(baseline)])].filter((f) => !excluded.has(f) && (!existsSync(path.join(dir, f)) || !(f in baseline) || readFileSync(path.join(dir, f), 'utf8') !== baseline[f])).sort();
}
if (args.includes('--self-test')) {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'packfuse-eval-'));
  try {
    for (const task of tasks) {
      const work = path.join(temp, task.id);
      for (const [name, body] of Object.entries(task.files)) write(path.join(work, name), body);
      if (grade(task, work).passed) throw new Error(`${task.id}: broken baseline unexpectedly passed`);
      for (const [name, body] of Object.entries(task.solution)) write(path.join(work, name), body);
      const result = grade(task, work);
      if (!result.passed) throw new Error(`${task.id}: reference repair failed: ${result.error}`);
      console.log(`${task.id}: baseline fails; reference repair passes`);
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
} else if (args.includes('--prepare')) {
  const outValue = get('--out'); const mode = get('--mode'); const tool = get('--tool'); const model = get('--model');
  const repeats = Number(get('--repeats', '3'));
  if (!outValue || !['baseline','general','domain'].includes(mode) || !['cursor','claude','codex'].includes(tool) || !model || !Number.isInteger(repeats) || repeats < 1 || repeats > 20) throw new Error(help);
  const out = path.resolve(outValue);
  if (existsSync(out)) throw new Error('Output directory already exists; use a fresh directory to preserve previous runs');
  if (mode !== 'baseline' && !existsSync(path.join(root, 'dist/cli.js'))) throw new Error('Run npm run build before preparing packs');
  mkdirSync(out, { recursive: true });
  const runs = [];
  for (const task of tasks) for (let repeat = 1; repeat <= repeats; repeat++) {
    const name = `${task.id}-${repeat}`; const work = path.join(out, name, 'work');
    for (const [file, body] of Object.entries(task.files)) write(path.join(work, file), body);
    write(path.join(work, 'PROMPT.md'), task.prompt + '\nDo not inspect evaluator source or reference repairs. Work only inside this task workspace.\n');
    if (mode !== 'baseline') {
      const packs = mode === 'domain' && task.pack !== 'general' ? ['general', task.pack] : ['general'];
      for (const pack of packs) {
        const result = spawnSync(process.execPath, [path.join(root, 'dist/cli.js'), 'install', '--project', '--tool', tool, '--pack', pack, '--cwd', work], { encoding: 'utf8' });
        if (result.status !== 0) throw new Error(result.stderr || result.stdout);
      }
    }
    write(path.join(out, name, 'evidence.json'), JSON.stringify({ tokens: null, transcript: null, failingTestBeforeFix: null, verificationRan: null, notes: '' }, null, 2) + '\n');
    runs.push({ task: task.id, repeat, name });
  }
  write(path.join(out, 'runs.json'), JSON.stringify({ preparedAt: new Date().toISOString(), model, tool, mode, runs }, null, 2) + '\n');
  console.log(`Prepared ${runs.length} tasks in ${out}. Run your model separately; no model was run.`);
} else if (args.includes('--grade')) {
  if (!get('--out')) throw new Error(help);
  const out = path.resolve(get('--out')); const manifest = JSON.parse(readFileSync(path.join(out, 'runs.json'), 'utf8'));
  const results = [];
  for (const run of manifest.runs) {
    if (!/^[a-z0-9-]+$/.test(run.name)) throw new Error('Invalid run name');
    const task = tasks.find((t) => t.id === run.task); if (!task) throw new Error(`Unknown task ${run.task}`);
    const work = path.join(out, run.name, 'work');
    const evidence = JSON.parse(readFileSync(path.join(out, run.name, 'evidence.json'), 'utf8'));
    const result = { ...run, ...grade(task, work), changedFiles: changedFiles(work, task.files), reportedEvidence: evidence };
    results.push(result); console.log(`${run.name}: ${result.passed ? 'PASS' : 'FAIL'}; changed files=${result.changedFiles.length}`);
  }
  write(path.join(out, 'results.json'), JSON.stringify({ ...manifest, gradedAt: new Date().toISOString(), gradingScope: 'behavior only; process evidence is reported, not automatically verified', results }, null, 2) + '\n');
  const cell = (v) => String(v).replace(/[|\r\n]/g, ' ');
  const report = `# Evaluation results\n\nModel: ${cell(manifest.model)}; mode: ${cell(manifest.mode)}; tool: ${cell(manifest.tool)}.\n\n| Run | Behavior | Changed files | Reported tokens |\n| --- | --- | --- | --- |\n` + results.map((r) => `| ${r.name} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.changedFiles.length} | ${r.reportedEvidence.tokens ?? 'unknown'} |`).join('\n') + '\n\nBehavioral checks do not prove minimal diffs, test-first work, real browser usability, or actual skill invocation. Review transcripts separately.\n';
  write(path.join(out, 'report.md'), report);
  if (results.some((r) => !r.passed)) process.exitCode = 1;
} else { console.log(help); if (!args.includes('--help')) process.exitCode = 1; }
