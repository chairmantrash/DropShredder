import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const runtimeFiles=[];

function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(/\.(?:ts|tsx|js|mjs|html)$/.test(entry.name)) runtimeFiles.push(full);
  }
}
for(const root of ['src','entrypoints']) walk(root);

const forbidden=[
  ['eval',/\beval\s*\(/],
  ['Function constructor',/\bnew\s+Function\s*\(/],
  ['page cookie access',/\bdocument\.cookie\b/],
  ['Chrome cookies API',/\b(?:chrome|browser)\.cookies\b/],
  ['localStorage',/\blocalStorage\b/],
  ['sessionStorage',/\bsessionStorage\b/],
  ['dynamic innerHTML write',/\.innerHTML\s*=/],
  ['credentialed cross-origin fetch',/credentials\s*:\s*['"]include['"]/],
  ['remote JavaScript import',/\bimport\s*\(\s*['"]https?:\/\//],
  ['remote importScripts',/\bimportScripts\s*\(\s*['"]https?:\/\//],
];

for(const file of runtimeFiles){
  const text=fs.readFileSync(file,'utf8');
  for(const [name,pattern] of forbidden){
    if(pattern.test(text)) failures.push(`${file}: forbidden ${name}`);
  }
  if(/fetch\s*\(\s*['"]http:\/\//.test(text)) failures.push(`${file}: insecure HTTP fetch literal`);
}

const config=fs.readFileSync('wxt.config.ts','utf8');
const required=['scripting','storage','contextMenus','sidePanel','alarms'];
const requiredMatch=config.match(/permissions\s*:\s*\[([^\]]+)\]/s);
const actual=requiredMatch
  ? [...requiredMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(match=>match[1])
  : [];
if(JSON.stringify(actual)!==JSON.stringify(required)){
  failures.push(`wxt.config.ts: required permissions differ from reviewed baseline: ${JSON.stringify(actual)}`);
}
if(/host_permissions\s*:\s*\[/s.test(config) && !/optional_host_permissions/.test(config)){
  failures.push('wxt.config.ts: permanent host_permissions detected');
}
if(!/optional_host_permissions\s*:\s*\['https:\/\/\*\/\*'\]/.test(config)){
  failures.push('wxt.config.ts: optional host baseline changed');
}
for(const permission of ['cookies','history','webRequest','webRequestBlocking','debugger','management','proxy','nativeMessaging','clipboardRead','identity']){
  if(new RegExp(`['"]${permission}['"]`).test(config)) failures.push(`wxt.config.ts: high-risk permission ${permission}`);
}
if(!/script-src 'self'/.test(config)) failures.push('wxt.config.ts: self-only extension CSP missing');

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
if(JSON.stringify(pkg.dependencies ?? {})!==JSON.stringify({tldts:'7.4.18'})) failures.push('package.json: dependency graph differs from reviewed tldts 7.4.18 baseline');
if(!fs.existsSync('brain/decisions/20261009-001-runtime-reconciliation.md') || !fs.existsSync('public/THIRD-PARTY-NOTICES.txt')) failures.push('Domain parser review or license notice missing');

if(failures.length){
  console.error('DropShredder security audit failed:\n'+failures.map(item=>' - '+item).join('\n'));
  process.exit(1);
}
console.log(`Security audit passed: ${runtimeFiles.length} runtime files, reviewed permission baseline, pinned reviewed local domain parser.`);
