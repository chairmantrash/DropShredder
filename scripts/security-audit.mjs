import fs from 'node:fs';
import path from 'node:path';

const roots=['src','entrypoints'];
const runtimeFiles=[];

function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) runtimeFiles.push(full);
  }
}

for(const root of roots) walk(root);

const forbidden=[
  {name:'eval',pattern:/\beval\s*\(/},
  {name:'Function constructor',pattern:/\bnew\s+Function\s*\(/},
  {name:'page cookie read/write',pattern:/\bdocument\.cookie\b/},
  {name:'Chrome cookies API',pattern:/\b(?:chrome|browser)\.cookies\b/},
  {name:'localStorage',pattern:/\blocalStorage\b/},
  {name:'sessionStorage',pattern:/\bsessionStorage\b/},
  {name:'dynamic innerHTML write',pattern:/\.innerHTML\s*=/},
  {name:'credentialed cross-origin fetch',pattern:/credentials\s*:\s*['"]include['"]/},
  {name:'remote JavaScript import',pattern:/\bimport\s*\(\s*['"]https?:\/\//},
  {name:'password-field scraping',pattern:/input\s*\[\s*type\s*=\s*['"]?password/i},
];

const failures=[];
for(const file of runtimeFiles){
  const text=fs.readFileSync(file,'utf8');
  for(const rule of forbidden){
    if(rule.pattern.test(text)) failures.push(`${file}: forbidden ${rule.name}`);
  }
  const insecure=[...text.matchAll(/fetch\s*\(\s*['"]http:\/\/[^'"]+/g)];
  if(insecure.length) failures.push(`${file}: insecure HTTP fetch literal`);
}

const config=fs.readFileSync('wxt.config.ts','utf8');
const dangerousPermissions=['cookies','history','webRequest','webRequestBlocking','debugger','management','proxy','nativeMessaging','clipboardRead'];
for(const permission of dangerousPermissions){
  const re=new RegExp(`permissions\\s*:[^\\]]*['"]${permission}['"]`,'s');
  if(re.test(config)) failures.push(`wxt.config.ts: dangerous required permission "${permission}"`);
}
if(/host_permissions\s*:\s*\[[^\]]*(?:<all_urls>|https:\/\/\*\/\*)/s.test(config)){
  failures.push('wxt.config.ts: broad permanent host_permissions are forbidden; use optional_host_permissions/activeTab');
}

const requiredPermissionMatch=config.match(/permissions\s*:\s*\[([^\]]+)\]/s);
if(requiredPermissionMatch){
  const permissions=[...requiredPermissionMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]);
  const allowed=new Set(['activeTab','scripting','storage','contextMenus','sidePanel']);
  for(const permission of permissions){
    if(!allowed.has(permission)) failures.push(`wxt.config.ts: unreviewed required permission "${permission}"`);
  }
}

if(failures.length){
  console.error('DropShredder security audit failed:\n'+failures.map(x=>' - '+x).join('\n'));
  process.exit(1);
}
console.log(`DropShredder security audit passed (${runtimeFiles.length} runtime files checked).`);
