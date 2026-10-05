import { readFileSync, existsSync } from 'node:fs';
import { encodingForModel } from 'js-tiktoken';
const enc = encodingForModel('gpt-4');
const files = process.argv.slice(2);
let t = 0;
for (const f of files) {
  if (!existsSync(f)) continue;
  const n = enc.encode(readFileSync(f, 'utf8')).length;
  t += n;
  console.log(n, f);
}
console.log('total', t);
