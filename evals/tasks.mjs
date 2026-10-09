// Small, deterministic fixtures. Reference repairs are used ONLY to check graders.
export const tasks = [
  {
    id: 'ci-fix', pack: 'general', prompt: 'The CI check fails. Fix the failing behavior without changing the exported signature or weakening checks.',
    files: { 'app.mjs': 'export const double = n => n + 2;\n' },
    checks: "const {double}=await load('app.mjs'); assert.equal(double(3),6); assert.equal(double(-2),-4); assert.equal(double(0),0);",
    solution: { 'app.mjs': 'export const double = n => n * 2;\n' },
  },
  {
    id: 'bugfix', pack: 'general', prompt: 'Fix average([]) returning NaN. Empty input must return 0; nonempty averages must remain correct. Add a regression test.',
    files: { 'app.mjs': 'export const average = xs => xs.reduce((a,b)=>a+b,0)/xs.length;\n' },
    checks: "const {average}=await load('app.mjs'); assert.equal(average([]),0); assert.equal(average([2,4]),3); assert.equal(average([-2,2]),0);",
    solution: { 'app.mjs': 'export const average = xs => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;\n' },
  },
  {
    id: 'merge-conflict', pack: 'general', prompt: 'Resolve this conflicting module. Preserve both exported operations and verify the results. Do not perform Git history operations.',
    files: { 'app.mjs': '<<<<<<< feature-a\nexport const add = (a,b) => a+b;\n=======\nexport const subtract = (a,b) => a-b;\n>>>>>>> feature-b\n' },
    checks: "const {add,subtract}=await load('app.mjs'); assert.equal(add(3,2),5); assert.equal(subtract(3,2),1);",
    solution: { 'app.mjs': 'export const add = (a,b) => a+b;\nexport const subtract = (a,b) => a-b;\n' },
  },
  {
    id: 'small-feature', pack: 'general', prompt: 'Extend greet(name) with an optional prefix defaulting to Hello. Preserve greet("Ada") and support greet("Ada", "Hi"). Add tests.',
    files: { 'app.mjs': 'export const greet = name => `Hello, ${name}!`;\n' },
    checks: "const {greet}=await load('app.mjs'); assert.equal(greet('Ada'),'Hello, Ada!'); assert.equal(greet('Ada','Hi'),'Hi, Ada!');",
    solution: { 'app.mjs': 'export const greet = (name,prefix="Hello") => `${prefix}, ${name}!`;\n' },
  },
  {
    id: 'api-contract', pack: 'api', prompt: 'Implement validateLimit(value): accept integers 1..100 and return {ok:true,value}; otherwise return {ok:false,error:"INVALID_LIMIT"}. Do not coerce strings.',
    files: { 'app.mjs': 'export const validateLimit = value => ({ok:true,value});\n' },
    checks: "const {validateLimit}=await load('app.mjs'); for(const n of [1,100]) assert.deepEqual(validateLimit(n),{ok:true,value:n}); for(const n of [0,101,1.5,'3',null]) assert.deepEqual(validateLimit(n),{ok:false,error:'INVALID_LIMIT'});",
    solution: { 'app.mjs': 'export const validateLimit = value => Number.isInteger(value)&&value>=1&&value<=100 ? {ok:true,value} : {ok:false,error:"INVALID_LIMIT"};\n' },
  },
  {
    id: 'web-ui', pack: 'web-ui', prompt: 'Make this tiny search form keyboard-usable using a visible label associated with id=q, a text input name=q, and a native submit button. Preserve method=get. This fixture only grades structural semantics.',
    files: { 'index.html': '<form method="get"><input id="q"><div>Search</div></form>\n' },
    checks: "const html=read('index.html'); assert.match(html,/<form[^>]*method=[\"']get[\"']/i); assert.match(html,/<label[^>]*for=[\"']q[\"'][^>]*>[^<]+<\\/label>/i); const input=html.match(/<input\\b[^>]*>/i)?.[0]??''; assert.match(input,/id=[\"']q[\"']/i); assert.match(input,/name=[\"']q[\"']/i); assert.match(html,/<button[^>]*type=[\"']submit[\"'][^>]*>[^<]+<\\/button>/i);",
    solution: { 'index.html': '<form method="get"><label for="q">Search</label><input id="q" name="q" type="text"><button type="submit">Search</button></form>\n' },
  },
  {
    id: 'authorization', pack: 'security', prompt: 'Review and fix canRead(user,doc): deny absent users; permit the owner or an admin. Regular users must not read another owner’s document. Add negative tests using synthetic fixtures.',
    files: { 'app.mjs': 'export const canRead = (user,doc) => !!user;\n' },
    checks: "const {canRead}=await load('app.mjs'); const doc={ownerId:'a'}; assert.equal(canRead(null,doc),false); assert.equal(canRead({id:'a',role:'user'},doc),true); assert.equal(canRead({id:'b',role:'user'},doc),false); assert.equal(canRead({id:'b',role:'admin'},doc),true);",
    solution: { 'app.mjs': 'export const canRead = (user,doc) => !!user && (user.id===doc.ownerId || user.role==="admin");\n' },
  },
];
