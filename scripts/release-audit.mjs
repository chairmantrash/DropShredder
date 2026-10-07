import { promises as fs } from 'node:fs';
import path from 'node:path';

const root='.output/chrome-mv3';
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));

function fail(message){ throw new Error(message); }

if(manifest.manifest_version!==3) fail('Release must be Manifest V3.');
const expected=['scripting','storage','contextMenus','sidePanel'].sort();
const actual=[...(manifest.permissions ?? [])].sort();
if(JSON.stringify(actual)!==JSON.stringify(expected)){
  fail(`Unexpected required permissions: ${JSON.stringify(actual)}`);
}
if((manifest.host_permissions ?? []).length) fail('Permanent host_permissions are not allowed.');
const optional=[...(manifest.optional_host_permissions ?? [])];
if(JSON.stringify(optional)!==JSON.stringify(['https://*/*'])){
  fail(`Unexpected optional host permissions: ${JSON.stringify(optional)}`);
}
if(!manifest.content_security_policy?.extension_pages?.includes("script-src 'self'")){
  fail('Self-only extension CSP is missing.');
}

const files=[];
async function walk(dir){
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) await walk(full);
    else files.push(full);
  }
}
await walk(root);

const forbiddenNames=[
  /(^|\/)node_modules(\/|$)/,
  /\.map$/i,
  /\.pem$/i,
  /\.key$/i,
  /(^|\/)\.env(?:\.|$)/i,
];
for(const file of files){
  const rel=file.replaceAll('\\','/');
  if(forbiddenNames.some(pattern=>pattern.test(rel))) fail(`Forbidden packaged file: ${rel}`);
}

const codeFiles=files.filter(file=>/\.(?:js|mjs|html)$/i.test(file));
for(const file of codeFiles){
  const text=await fs.readFile(file,'utf8');
  if(/\beval\s*\(/.test(text)) fail(`eval() found in packaged code: ${file}`);
  if(/new\s+Function\s*\(/.test(text)) fail(`new Function() found in packaged code: ${file}`);
  if(/document\.cookie|chrome\.cookies|browser\.cookies/.test(text)) fail(`cookie access found in packaged code: ${file}`);
}

let totalBytes=0;
for(const file of files) totalBytes+=(await fs.stat(file)).size;
const budget=10*1024*1024;
if(totalBytes>budget) fail(`Unpacked extension exceeds 10 MiB budget: ${totalBytes} bytes`);

console.log(JSON.stringify({
  manifestVersion:manifest.manifest_version,
  requiredPermissions:actual,
  optionalHosts:optional,
  packagedFiles:files.length,
  unpackedBytes:totalBytes,
  budgetBytes:budget,
},null,2));
