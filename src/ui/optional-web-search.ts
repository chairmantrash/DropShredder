import { tr, errorText } from '../i18n/index';
import { BRAVE_ORIGIN, supplierSearchWithKey } from '../osint/optional-brave';

export function mountOptionalWebSearch(doc:Document=document):void{
  const get=<T extends HTMLElement>(id:string)=>doc.getElementById(id) as T|null;
  const key=get<HTMLInputElement>('brave-key'),query=get<HTMLInputElement>('brave-query'),
    button=get<HTMLButtonElement>('brave-search'),cancel=get<HTMLButtonElement>('brave-cancel'),
    status=get<HTMLElement>('brave-status'),results=get<HTMLElement>('brave-results');
  if(!key||!query||!button||!cancel||!status||!results)return;
  let pending:AbortController|undefined;
  const stop=()=>{pending?.abort();pending=undefined;cancel.disabled=true;button.disabled=false;};
  cancel.addEventListener('click',()=>{stop();status.textContent=tr('Search canceled. The API key is not saved.');});
  button.addEventListener('click',()=>{
    if(pending)return;
    const token=key.value,phrase=query.value;
    key.value=''; // Never retain the secret in a DOM field or any Chrome storage.
    const ctl=new AbortController();pending=ctl;button.disabled=true;cancel.disabled=false;
    results.replaceChildren();status.textContent=tr('Requesting one explicit Brave Search query. No browser history is transmitted.');
    // Request host access before any awaited work in this user gesture.
    const permission=chrome.permissions.request({origins:[BRAVE_ORIGIN]});
    void permission.then(async allowed=>{
      if(pending!==ctl)return;
      if(!allowed||ctl.signal.aborted){status.textContent=tr('Permission denied or canceled; no request sent.');return;}
      const matches=await supplierSearchWithKey(phrase,token,ctl.signal);
      if(pending!==ctl || !await chrome.permissions.contains({origins:[BRAVE_ORIGIN]}))return;
      for(const item of matches){
        const section=doc.createElement('article');section.className='evidence-row';
        const a=doc.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.title;
        const description=doc.createElement('p');description.textContent=item.description;
        section.append(a,description);results.append(section);
      }
      status.textContent=matches.length?tr('Source candidates: $1. Check originals before attribution; no verdict changed.',matches.length):tr('No results. No negative inference can be made.');
    }).catch(e=>{if(pending===ctl)status.textContent=ctl.signal.aborted?tr('Canceled.'):e instanceof Error?errorText(e):tr('Web search unavailable.');})
      .finally(()=>{if(pending===ctl){pending=undefined;button.disabled=false;cancel.disabled=true;}});
  });
  const revoke=()=>{stop();key.value='';results.replaceChildren();status.textContent=tr('Search canceled while site access is removed. The API key is not saved.');};
  doc.getElementById('revoke-optional-access')?.addEventListener('click',revoke);
  chrome.permissions.onRemoved.addListener(({origins})=>{
    if(origins?.some(origin=>[BRAVE_ORIGIN,'https://*/*','*://*/*','<all_urls>'].includes(origin)))revoke();
  });
}
