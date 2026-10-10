import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {parseHTML} from 'linkedom';
import {messageKey} from '../src/i18n/index';

export const LOCALES=['en','zh_CN','hi','es','ar','fr','bn','pt_BR'] as const;
type Message={message:string;description?:string;placeholders?:Record<string,{content:string;example:string}>};
export function auditLocalization():{locales:number;messages:number;authoredCalls:number} {
  const english=JSON.parse(fs.readFileSync('public/_locales/en/messages.json','utf8')) as Record<string,Message>;
  const keys=Object.keys(english).sort(),sources=new Set<string>();
  const slots=(text:string)=>[...text.matchAll(/\$arg([1-9])\$/g)].map(m=>m[1]).sort();
  for(const [key,row]of Object.entries(english)){
    if(key.startsWith('m_')){assert.equal(messageKey(row.description!),key,'Stable source/key mismatch');assert.ok(!sources.has(row.description!), 'Duplicate source');sources.add(row.description!);}
  }
  for(const locale of LOCALES){
    const catalog=JSON.parse(fs.readFileSync(`public/_locales/${locale}/messages.json`,'utf8')) as Record<string,Message>;
    assert.deepEqual(Object.keys(catalog).sort(),keys,`${locale}: missing/extra keys`);
    assert.equal(catalog.locale_code!.message,locale.replace('_','-'));
    for(const key of keys){const row=catalog[key]!;
      assert.ok(row.message.trim(),`${locale}/${key}: empty message`);
      assert.deepEqual(slots(row.message),slots(english[key]!.message),`${locale}/${key}: lost or duplicated substitutions`);
      assert.deepEqual(row.placeholders,english[key]!.placeholders,`${locale}/${key}: changed positional mapping`);
      assert.ok(!/[<>]|[\u202a-\u202e\u2066-\u2069]/u.test(row.message),`${locale}/${key}: HTML or directional control in authored copy`);
      assert.ok(!/\$(?!arg[1-9]\$)/.test(row.message.replace(/\$arg[1-9]\$/g,'')),`${locale}/${key}: malformed native placeholder`);
    }
  }
  for(const file of ['entrypoints/sidepanel/index.html','entrypoints/search/index.html']){
    const {document}=parseHTML(fs.readFileSync(file,'utf8'));
    const visit=(node:Node):void=>{
      if(node.nodeType===3){const text=node.textContent?.trim();if(text)assert.ok(sources.has(text),`${file}: uncataloged static text ${text}`);return;}
      if(node.nodeType!==1||['SCRIPT','STYLE','PRE','CODE'].includes((node as Element).tagName))return;
      for(const attr of ['title','placeholder','aria-label']){const text=(node as Element).getAttribute(attr);if(text)assert.ok(sources.has(text),`${file}: uncataloged ${attr}`);}
      for(const child of node.childNodes)visit(child);
    };visit(document.documentElement);
  }
  let authoredCalls=0;
  const files:string[]=[];
  const walk=(dir:string)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())walk(f);else if(f.endsWith('.ts'))files.push(f);}};
  walk('entrypoints');walk('src/ui');walk('src/i18n');
  for(const f of files){const source=ts.createSourceFile(f,fs.readFileSync(f,'utf8'),ts.ScriptTarget.Latest,true);
    const visit=(node:ts.Node)=>{if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='tr'){
      const first=node.arguments[0];if(first&&ts.isStringLiteral(first)){authoredCalls++;assert.ok(sources.has(first.text),`${f}: uncataloged message ${first.text}`);
        const indices=[...first.text.matchAll(/\$([1-9])/g)].map(m=>Number(m[1]));assert.equal(node.arguments.length-1,indices.length?Math.max(...indices):0,`${f}: incorrect substitution count`);
      }}ts.forEachChild(node,visit);};visit(source);
  }
  return {locales:LOCALES.length,messages:keys.length,authoredCalls};
}
if(process.argv[1]?.endsWith('localization-audit.ts')) console.log('Localization audit passed:',auditLocalization());
