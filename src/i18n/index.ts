/** Native, packaged Chrome catalogs. No remote translation, HTML parsing or locale polling. */
export function messageKey(source:string):string {
  let hash=2166136261;
  for(let i=0;i<source.length;i++) hash=Math.imul(hash^source.charCodeAt(i),16777619);
  return 'm_'+(hash>>>0).toString(36);
}

export function tr(source:string,...values:Array<string|number>):string {
  const substitutions=values.map(value=>uiDirection()==='rtl'?'\u2068'+String(value)+'\u2069':String(value));
  try {
    const message=globalThis.chrome?.i18n?.getMessage(messageKey(source),substitutions);
    if(message) return message;
  } catch { /* Tests/unsupported runtime keep a readable English fallback. */ }
  return values.length?source.replace(/\$([1-9])/g,(_,n:string)=>substitutions[Number(n)-1]??''):source;
}

/** Known refusals are localized; unknown technical failures retain bounded diagnostic text. */
export function errorText(error:unknown):string {
  const source=(error instanceof Error?error.message:String(error)).slice(0,600);
  const translated=tr(source);
  return translated!==source || /^en(?:-|$)/i.test(uiLanguage())?translated:
    tr('Action could not complete. Details (original language): $1',source);
}

export function uiLanguage():string {
  try { return chrome.i18n.getMessage('locale_code')||'en'; }
  catch { return 'en'; }
}

export function uiDirection():'rtl'|'ltr' {
  return /^ar(?:-|$)/i.test(uiLanguage())?'rtl':'ltr';
}

/** Translate the extension's initial static document only, never merchant/source content. */
export function localizeDocument(doc:Document=document):void {
  doc.documentElement.lang=uiLanguage();
  doc.documentElement.dir=uiDirection();
  const visit=(node:Node):void=>{
    if(node.nodeType===3){
      const source=node.textContent??'',trimmed=source.trim();
      if(trimmed) node.textContent=source.replace(trimmed,tr(trimmed));
      return;
    }
    if(node.nodeType!==1) return;
    const element=node as Element;
    if(['SCRIPT','STYLE','PRE','CODE'].includes(element.tagName)) return;
    for(const attr of ['title','placeholder','aria-label']){
      const source=element.getAttribute(attr);if(source) element.setAttribute(attr,tr(source));
    }
    for(const child of [...element.childNodes]) visit(child);
  };
  visit(doc.documentElement);
}
