import { readFileSync } from 'node:fs';
if (!process.argv.slice(2).length) { console.error('Usage: node estimate.mjs FILE...'); process.exit(1); }
let encode;
try { const { getEncoding } = await import('js-tiktoken'); const enc = getEncoding('cl100k_base'); encode = (s) => enc.encode(s).length; }
catch { encode = (s) => Math.ceil(s.length / 4); console.error('Approximation: ceil(UTF-16 characters / 4); js-tiktoken unavailable. Not tokenizer-equivalent; non-English text may vary substantially.'); }
let total = 0;
for (const file of [...new Set(process.argv.slice(2))]) {
  try { const count = encode(readFileSync(file, 'utf8')); total += count; console.log(count, file); }
  catch (error) { console.error(`Cannot read ${file}: ${error.message}`); process.exitCode = 1; }
}
console.log('total estimate', total);
