// Selector values cross CDP as data. They never become executable source.
const operations={
 visible:'function(selector){return Boolean(this.querySelector(selector)?.getBoundingClientRect().width);}',
 scroll:"function(selector){const e=this.querySelector(selector);if(!e||e.disabled)throw Error('Missing/disabled control');e.scrollIntoView({block:'center'});}",
 point:"function(selector){const e=this.querySelector(selector);if(!e||e.disabled)throw Error('Missing/disabled control');const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=this.elementFromPoint(x,y);if(!r.width||!r.height||!(h===e||e.contains(h)))throw Error('Hidden/obscured control');return {x,y,width:innerWidth,height:innerHeight};}"
};

export async function nativeControl(call,selector,operation){
 if(typeof selector!=='string'||!selector||selector.length>2000)throw Error('Invalid native selector');
 if(!Object.hasOwn(operations,operation))throw Error('Unknown native control operation');
 const document=await call('Runtime.evaluate',{expression:'document',returnByValue:false});
 if(document.exceptionDetails||!document.result?.objectId)throw Error('Native document unavailable');
 const objectId=document.result.objectId;
 try{
  const result=await call('Runtime.callFunctionOn',{objectId,functionDeclaration:operations[operation],arguments:[{value:selector}],returnByValue:true});
  if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
 }finally{await call('Runtime.releaseObject',{objectId});}
}
