/** Static module reachability. Import reachability is an upper bound, never proof a detector executes. */
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=[...walk('src'),...walk('entrypoints')].filter(p=>p.endsWith('.ts'));
const graph=new Map(), exports=new Map(), importedNames=new Set();
for(const file of files){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true),deps=[];
 const names=[];
 for(const node of source.statements){
  if(ts.isImportDeclaration(node)&&node.importClause?.isTypeOnly!==true){
   const c=node.importClause;
   if(c?.namedBindings&&ts.isNamedImports(c.namedBindings)&&!c.name&&c.namedBindings.elements.every(e=>e.isTypeOnly))continue;
   const ref=node.moduleSpecifier.text;
   if(ref?.startsWith('.')){const full=path.normalize(path.join(path.dirname(file),ref));const found=[full+'.ts',path.join(full,'index.ts')].find(p=>files.includes(p));if(found)deps.push(found);}
   if(c?.namedBindings&&ts.isNamedImports(c.namedBindings))for(const e of c.namedBindings.elements)if(!e.isTypeOnly)importedNames.add((e.propertyName??e.name).text);
  }
  if(node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)&&ts.isFunctionDeclaration(node)&&node.name)names.push(node.name.text);
 }
 graph.set(file,deps);exports.set(file,names);
}
const reachable=new Set(),visit=f=>{if(reachable.has(f))return;reachable.add(f);for(const d of graph.get(f)??[])visit(d);};
files.filter(f=>f.startsWith('entrypoints/')).forEach(visit);
const domains=['analysis','forensics','osint','reputation','intelligence','detection','extraction'];
const modules=files.filter(f=>domains.includes(f.split('/')[1])).map(file=>({file,importReachable:reachable.has(file),exports:exports.get(file),noProductionNamedImport:(exports.get(file)??[]).filter(n=>!importedNames.has(n)),importedBy:[...graph].filter(([,deps])=>deps.includes(file)).map(([f])=>f)}));
const output={base:'8b801b53c5f7170ecfc7ee0c0324a7345d23eb55',method:'TypeScript AST relative value-import graph rooted at extension entrypoints; all exported functions listed; import reachability overstates execution when imports unused',total:modules.length,unreachable:modules.filter(m=>!m.importReachable).length,modules};
fs.writeFileSync(process.argv[2]??'workplane/runs/DS-061/module-inventory.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({total:modules.length,unreachable:modules.filter(m=>!m.importReachable).map(m=>m.file)}));
