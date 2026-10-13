import type { CommerceLanguageKit } from '../languages/commerce-kit';

export interface PublicStorePage {
  kind:'about'|'shipping'|'returns'|'contact'; url:string; text?:string; httpStatus?:number; unavailable?:string;
}

/** Serialized into Chrome ISOLATED world. Never depend on module closures. */
export async function fetchPublicStorePages(links:Array<{kind:PublicStorePage['kind'];url:string}>,privateParts:CommerceLanguageKit['privateFormParts']):Promise<PublicStorePage[]> {
  const safe=(value:string):URL|undefined=>{
    try { const u=new URL(value,location.href),path=decodeURIComponent(u.pathname).normalize('NFKC').toLowerCase();
      if(u.origin!==location.origin||u.protocol!=='https:'||u.username||u.password||u.href.length>2048||
        /checkout|payment/.test(path)||path.split('/').some(p=>privateParts.includes(p))||
        [...u.searchParams.keys()].some(k=>/token|session|password|email|auth|nonce/i.test(k)))return undefined;
      return u;
    } catch { return undefined; }
  };
  return Promise.all(links.slice(0,4).map(async link=>{
    const record:PublicStorePage={kind:link.kind,url:link.url};
    const u=safe(link.url);if(!u)return {...record,unavailable:'Private or unrelated destination excluded'};
    try {
      const response=await fetch(u.href,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(3500)});
      if(!response.ok)return {...record,httpStatus:response.status};
      if(!safe(response.url)||Number(response.headers.get('content-length')||0)>2_000_000||!response.body)return {...record,unavailable:'Unreadable or unrelated public document'};
      const reader=response.body.getReader(),decoder=new TextDecoder();let html='',bytes=0;
      try { for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
        if(bytes>2_000_000)return {...record,unavailable:'Document exceeds bounded size'};
        html+=decoder.decode(value,{stream:true});}html+=decoder.decode();
      } finally { void reader.cancel().catch(()=>{}); }
      const doc=new DOMParser().parseFromString(html,'text/html');
      const fields=doc.querySelectorAll('input[type="password"],input[autocomplete~="cc-number"],input[autocomplete~="cc-csc"],input[autocomplete~="current-password"],input[autocomplete~="new-password"],input[name*="cardnumber" i]');
      const forms=doc.getElementsByTagName('form');
      if(fields.length>64||forms.length>30)return {...record,unavailable:'Private-region budget exceeded'};
      const remove=new Set<Element>();
      for(const f of fields)remove.add(f.closest('form,dialog,[role="dialog"]')||f.parentElement||f);
      for(let i=0;i<forms.length;i++){
        const form=forms.item(i)!;
        try{const action=form.getAttribute('action');if(!action)continue;
          const path=decodeURIComponent(new URL(action,response.url).pathname).normalize('NFKC').toLowerCase();
          if(/checkout|payment/.test(path)||path.split('/').some(p=>privateParts.includes(p)))remove.add(form);
        }catch{remove.add(form);}
      }
      for(const el of remove)el.remove();
      // Detached-document innerText includes non-rendered/script content in browsers.
      // Walk only remaining text nodes, never input values or arbitrary attributes.
      const walk=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT),pieces:string[]=[];let visited=0,chars=0;
      while(visited++<4500&&chars<100_000){const node=walk.nextNode();if(!node)break;const parent=node.parentElement;
        if(!parent||parent.closest('script,style,noscript,textarea,input,select,option,[contenteditable="true"],[hidden],[aria-hidden="true"],blockquote'))continue;
        let hidden=false,ancestor:Element|null=parent;
        for(let depth=0;ancestor&&depth<40;depth++,ancestor=ancestor.parentElement){if(/display\s*:\s*none|visibility\s*:\s*hidden/i.test(ancestor.getAttribute('style')||'')){hidden=true;break;}}
        if(hidden||ancestor)continue;
        const value=(node.nodeValue||'').replace(/\s+/g,' ').trim().slice(0,Math.min(1500,100_000-chars));
        if(value){pieces.push(value);chars+=value.length+1;}
      }
      return {...record,url:response.url,text:pieces.join(' ').slice(0,100_000)};
    }catch{return {...record,unavailable:'Public page unavailable'};}
  }));
}
