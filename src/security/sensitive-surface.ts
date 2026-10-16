/** Self-contained for Chrome serialization; reads structure/layout, never field values. */
export function hasSensitiveCommerceSurface(privateFormParts:string[],doc:Document=document):boolean {
  const rendered=(element:Element):boolean=>{
    let displayContents=false;
    let ancestor:Element|null=element;
    for(let depth=0;ancestor&&depth<40;depth++,ancestor=ancestor.parentElement){
      if(ancestor.hasAttribute('hidden')||ancestor.getAttribute('aria-hidden')==='true'||ancestor.matches('dialog:not([open])')) return false;
      try{
        const style=doc.defaultView?.getComputedStyle?.(ancestor);
        if(ancestor===element&&style?.display==='contents') displayContents=true;
        if(style?.display==='none'||style?.visibility==='hidden'||style?.visibility==='collapse') return false;
        // Also works in a non-rendering test document. Missing layout fails closed.
        if(!style&&(/display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)/i.test(ancestor.getAttribute('style')||''))) return false;
      }catch{return true;}
    }
    if(ancestor) return true; // Depth bound is uncertainty, not permission to scan.
    if(displayContents) return true; // Visible children can outlive a zero-box form.
    if(!doc.defaultView?.getComputedStyle||typeof element.getClientRects!=='function') return true;
    try{return element.getClientRects().length>0;}catch{return true;}
  };
  const fields=doc.querySelectorAll([
    'input[type="password"]','input[autocomplete~="cc-number"]','input[autocomplete~="cc-csc"]',
    'input[autocomplete~="current-password"]','input[autocomplete~="new-password"]',
    'input[name*="cardnumber" i]',
  ].join(','));
  if(fields.length>64) return true;
  for(const field of fields){
    // A zero-size field inside a visible private form/modal still blocks.
    const region=field.closest('form,dialog,[role="dialog"]');
    if(rendered(field)||(region&&rendered(region))) return true;
  }
  const forms=doc.getElementsByTagName('form');
  if(forms.length>30) return true;
  for(let i=0;i<Math.min(forms.length,30);i++){
    const form=forms.item(i)!;
    const action=form.getAttribute('action');
    if(!action) continue;
    try{
      const url=new URL(action,doc.baseURI);
      const parts=decodeURIComponent(url.pathname).normalize('NFKC').toLowerCase().split('/');
      if((/checkout|payment/i.test(url.pathname)||parts.some(part=>privateFormParts.includes(part)))&&rendered(form)) return true;
    }catch{}
  }
  return false;
}

/** Regions whose contents are excluded even when the live form is dormant. */
export function privateCommerceRegions(privateFormParts:string[],doc:Document=document):Element[]{
  const roots=new Set<Element>();
  const fields=doc.querySelectorAll('input[type="password"],input[autocomplete~="cc-number"],input[autocomplete~="cc-csc"],input[autocomplete~="current-password"],input[autocomplete~="new-password"],input[name*="cardnumber" i]');
  const forms=doc.getElementsByTagName('form');
  if(fields.length>64||forms.length>30)return [doc.documentElement];
  for(const field of fields)roots.add(field.closest('form,dialog,[role="dialog"]')||field.parentElement||field);
  for(let i=0;i<Math.min(forms.length,30);i++){
    const form=forms.item(i)!;
    try{const action=form.getAttribute('action');if(!action)continue;
      const path=decodeURIComponent(new URL(action,doc.baseURI).pathname).normalize('NFKC').toLowerCase();
      if(/checkout|payment/i.test(path)||path.split('/').some(p=>privateFormParts.includes(p)))roots.add(form);
    }catch{/* No destination is ever followed. */}
  }
  return [...roots];
}
