import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function sourceFiles(dir:string):Promise<string[]>{
  const out:string[]=[];
  for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...await sourceFiles(full));
    else if(/\.(?:ts|tsx|js|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('manifest keeps required permissions narrow and hosts optional',async()=>{
  const config=await fs.readFile('wxt.config.ts','utf8');
  assert.match(config,/permissions:\s*\['scripting', 'storage', 'contextMenus', 'sidePanel', 'alarms'\]/);
  assert.match(config,/optional_host_permissions:\s*\['https:\/\/\*\/\*'\]/);
  for(const forbidden of ['cookies','history','webRequest','debugger','nativeMessaging','management','privacy']){
    assert.equal(new RegExp(`['"]${forbidden}['"]`).test(config),false,`forbidden permission: ${forbidden}`);
  }
});

test('runtime source contains no remote-code or credential-access primitives',async()=>{
  const files=[
    ...await sourceFiles('src'),
    ...await sourceFiles('entrypoints'),
  ];
  const forbidden=[
    /\beval\s*\(/,
    /new\s+Function\s*\(/,
    /document\.cookie/,
    /chrome\.cookies/,
    /browser\.cookies/,
    /importScripts\s*\(\s*['"]https?:/i,
    /import\s*\(\s*['"]https?:/i,
    /<script[^>]+src=["']https?:/i,
    /credentials\s*:\s*['"]include['"]/,
  ];
  for(const file of files){
    const text=await fs.readFile(file,'utf8');
    for(const pattern of forbidden){
      assert.equal(pattern.test(text),false,`${file} matched forbidden runtime pattern ${pattern}`);
    }
  }
});

test('runtime domain parser is pinned and limited to its reviewed dependency',async()=>{
  const pkg=JSON.parse(await fs.readFile('package.json','utf8')) as {dependencies?:Record<string,string>};
  assert.deepEqual(pkg.dependencies,{tldts:'7.4.18'});
});

test('privacy policy discloses local history and no credential collection',async()=>{
  const privacy=await fs.readFile('PRIVACY.md','utf8');
  assert.match(privacy,/local/i);
  assert.match(privacy,/does not sell/i);
  assert.match(privacy,/does not.*password|does not collect.*credential|authentication/i);
});
