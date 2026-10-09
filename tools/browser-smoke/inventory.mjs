import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'../..','.output/chrome-mv3');
const entries=await fs.readdir(root,{recursive:true,withFileTypes:true});
const buildFiles=[];
for(const entry of entries.filter(item=>item.isFile())){
  const filepath=path.join(entry.parentPath,entry.name);
  const bytes=await fs.readFile(filepath);
  buildFiles.push({path:path.relative(root,filepath).replaceAll(path.sep,'/'),
    bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
buildFiles.sort((a,b)=>a.path.localeCompare(b.path));
console.log('DS_BUILD_INVENTORY='+JSON.stringify({buildFiles}));
