import { LIST_KEY, MAX_LIST_BYTES, WEEK_MS, fetchListPreview, loadUserLists, mutateUserLists, previewList, validatePublisherKey, type ListPreview, type ListStore } from '../intelligence/user-lists';
import { lookupLegalEntity } from '../osint/gleif';

export function mountIntelligenceControls(doc:Document=document):void{
  const get=<T extends HTMLElement>(id:string)=>doc.getElementById(id) as T|null;
  const status=get<HTMLElement>('list-status'),preview=get<HTMLElement>('list-preview'),saved=get<HTMLElement>('saved-lists');
  const file=get<HTMLInputElement>('list-file'),url=get<HTMLInputElement>('list-url'),save=get<HTMLButtonElement>('list-save');
  const cancel=get<HTMLButtonElement>('list-cancel'),subscribe=get<HTMLInputElement>('list-subscribe');
  const keyInput=get<HTMLTextAreaElement>('publisher-key'),keyStatus=get<HTMLElement>('publisher-key-status'),pin=get<HTMLButtonElement>('publisher-pin');
  const entityInput=get<HTMLInputElement>('entity-lei'),entityStatus=get<HTMLElement>('entity-status'),entityResults=get<HTMLElement>('entity-results');
  const entityButton=get<HTMLButtonElement>('entity-lookup'),entityCancel=get<HTMLButtonElement>('entity-cancel');
  let store:ListStore={schemaVersion:1,lists:[],keys:[]},pending:{input:string;source?:string;preview:ListPreview}|undefined;
  let epoch=0,listRequest:AbortController|undefined,entityRequest:AbortController|undefined,pinnedInput:string|undefined;
  const message=(el:HTMLElement|null,value:unknown)=>{if(el) el.textContent=value instanceof Error?value.message:String(value);};
  const on=(id:string,fn:()=>void)=>get(id)?.addEventListener('click',fn);
  const clearPreview=()=>{epoch++;pending=undefined;preview?.replaceChildren();if(save) save.disabled=true;};
  const cancelList=()=>{listRequest?.abort();listRequest=undefined;if(cancel) cancel.disabled=true;clearPreview();};
  const show=(result:ListPreview,input:string,source?:string)=>{
    pending={input,source,preview:result};preview?.replaceChildren();
    const list=result.list,heading=doc.createElement('p');
    heading.textContent=`${list.title} • version ${list.version} • ${list.records.length} records • published ${list.publishedAt} • expires ${list.expiresAt} • license ${list.license} • ${result.stale?'EXPIRED — cannot activate':result.authentication==='user-pinned-key'?`Signature checked against your pinned key ${result.keyId}; facts remain unverified`:'UNSIGNED — facts and publisher identity unverified'}`;
    const sourceLink=doc.createElement('a');sourceLink.href=list.sourceUrl;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sourceLink.textContent=list.sourceUrl;
    preview?.append(heading,sourceLink);
    for(const r of list.records.slice(0,20)){const row=doc.createElement('p');row.textContent=`${r.id}: ${r.title} • ${r.gtin??`${r.brand} / ${r.mpn}`} • ${r.url} • ${Object.entries(r.attributes).map(([k,v])=>`${k}: ${v}`).join(', ')} • ${r.entities.map(e=>`${e.role}: ${e.name} (${e.sourceUrl}, ${e.observedAt})`).join('; ')}`;preview?.append(row);}
    if(list.records.length>20){const note=doc.createElement('p');note.textContent='Preview shows the first 20 records. Review the full JSON before adding this list.';preview?.append(note);}
    if(save) save.disabled=result.stale;message(status,'Preview ready. Adding a list keeps it local and does not change warning thresholds.');
  };
  const refresh=async()=>{
    store=await loadUserLists();saved?.replaceChildren();
    for(const row of store.lists){const section=doc.createElement('article');section.className='evidence-row';const label=doc.createElement('p');
      label.textContent=`${row.current.list.title} • v${row.current.list.version} • ${row.current.list.records.length} records • ${row.current.stale?'expired; matching disabled':'reference leads only'}${row.subscriptionUrl&&Date.now()-Date.parse(row.checkedAt)>=WEEK_MS?' • weekly refresh due':''}`;section.append(label);
      const button=(label:string,action:()=>Promise<unknown>)=>{const b=doc.createElement('button');b.className='secondary';b.textContent=label;b.addEventListener('click',()=>{b.disabled=true;void action().then(()=>refresh()).catch(e=>message(status,e)).finally(()=>{b.disabled=false;});});section.append(b);};
      button('Remove',()=>mutateUserLists({type:'remove',id:row.current.list.id}));
      if(row.previous) button('Restore previous version',()=>mutateUserLists({type:'rollback',id:row.current.list.id}));
      if(row.subscriptionUrl){const choose=doc.createElement('button');choose.className='secondary';choose.textContent='Select feed for refresh';choose.addEventListener('click',()=>{cancelList();if(url) url.value=row.subscriptionUrl!;if(subscribe) subscribe.checked=true;message(status,'Feed selected. Click Fetch preview to request a new copy; no request has been sent.');});section.append(choose);}
      saved?.append(section);
    }
    if(!store.lists.length) message(saved,'No user-added lists.');
  };
  file?.addEventListener('change',()=>{
    cancelList();const selected=file.files?.[0];if(!selected) return;const generation=epoch;
    if(selected.size>MAX_LIST_BYTES){message(status,'Choose a JSON file smaller than 800 KB.');return;}
    void selected.text().then(async input=>{const result=await previewList(input,store.keys);if(generation===epoch) show(result,input);}).catch(e=>{if(generation===epoch) message(status,e);});
  });
  url?.addEventListener('input',cancelList);subscribe?.addEventListener('change',()=>{if(pending&&!pending.source&&subscribe.checked){subscribe.checked=false;message(status,'Fetch a feed preview before saving a subscription.');}});
  on('list-fetch',()=>{
    cancelList();const generation=epoch,active=new AbortController();listRequest=active;if(cancel) cancel.disabled=false;message(status,'Requesting access to the feed you chose…');
    // No asynchronous storage read before the user-gesture permission request.
    void fetchListPreview(url?.value??'',store.keys,active.signal).then(result=>{
      if(generation!==epoch||listRequest!==active) return;if(!result){message(status,'Access was not granted or was removed. No list activated.');return;}
      show(result.preview,result.input,result.preview.list.sourceUrl);
    }).catch(e=>{if(generation===epoch) message(status,active.signal.aborted?'Feed fetch canceled.':e);}).finally(()=>{if(listRequest===active){listRequest=undefined;if(cancel) cancel.disabled=true;}});
  });
  on('list-cancel',()=>{cancelList();message(status,'Feed fetch canceled.');});
  on('list-save',()=>{const current=pending;if(!current||!save) return;save.disabled=true;
    void mutateUserLists({type:'save',input:current.input,...(subscribe?.checked&&current.source?{subscriptionUrl:current.source}:{})})
      .then(()=>{clearPreview();message(status,'List added locally. Feed refreshes require your next explicit request and preview.');return refresh();})
      .catch(e=>{message(status,e);if(pending===current) save.disabled=current.preview.stale;});
  });
  on('list-clear',()=>{cancelList();pinnedInput=undefined;if(pin) pin.disabled=true;void mutateUserLists({type:'clear'}).then(()=>{message(status,'User lists, previous versions, subscriptions and publisher keys removed.');return refresh();}).catch(e=>message(status,e));});
  keyInput?.addEventListener('input',()=>{pinnedInput=undefined;if(pin) pin.disabled=true;});
  on('publisher-preview',()=>{pinnedInput=undefined;if(pin) pin.disabled=true;try{
    const input=keyInput?.value??'',key=validatePublisherKey(JSON.parse(input));
    void crypto.subtle.digest('SHA-256',new TextEncoder().encode(key.publicKey)).then(hash=>{
      if(keyInput?.value!==input) return;const fingerprint=[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
      message(keyStatus,`${key.issuer} / ${key.keyId} • ${key.sourceUrl} • SHA-256 of base64url key: ${fingerprint}. Verify this key through an independent publisher channel. Pinning or replacing it is your trust decision; it does not validate allegations.`);pinnedInput=input;if(pin) pin.disabled=false;
    }).catch(e=>message(keyStatus,e));
  }catch(e){message(keyStatus,e);}});
  on('publisher-pin',()=>{if(!pinnedInput||keyInput?.value!==pinnedInput) return;const input=pinnedInput;if(pin) pin.disabled=true;
    void mutateUserLists({type:'pin',input}).then(()=>{pinnedInput=undefined;message(keyStatus,'Publisher key pinned. Re-preview signed feeds to verify with this key.');return refresh();}).catch(e=>message(keyStatus,e));
  });
  on('entity-lookup',()=>{
    if(entityRequest) return;const active=new AbortController();entityRequest=active;if(entityButton) entityButton.disabled=true;if(entityCancel) entityCancel.disabled=false;
    entityResults?.replaceChildren();message(entityStatus,'Requesting the exact LEI you chose from GLEIF…');
    void lookupLegalEntity(entityInput?.value??'',active.signal).then(result=>{
      if(entityRequest!==active) return;if(!result){message(entityStatus,'Access was not granted or was removed.');return;}
      const p=doc.createElement('p');p.textContent=`${result.name} • LEI ${result.lei} • ${result.jurisdiction} • entity ${result.status} • registration ${result.registrationStatus} • updated ${result.updatedAt??'not supplied'} • retrieved ${result.retrievedAt}`;
      const a=doc.createElement('a');a.href=result.sourceUrl;a.textContent='Original GLEIF record';a.target='_blank';a.rel='noopener noreferrer';entityResults?.append(p,a);
      message(entityStatus,'Legal identity record only. This does not link the entity to this seller, manufacturer or product, and does not establish safety or quality. GLEIF data: CC0; DropShredder is unaffiliated.');
    }).catch(e=>{if(entityRequest===active) message(entityStatus,active.signal.aborted?'Entity lookup canceled.':e);})
      .finally(()=>{if(entityRequest===active){entityRequest=undefined;if(entityButton) entityButton.disabled=false;if(entityCancel) entityCancel.disabled=true;}});
  });
  const cancelEntity=()=>{entityRequest?.abort();entityRequest=undefined;if(entityButton) entityButton.disabled=false;if(entityCancel) entityCancel.disabled=true;};
  on('entity-cancel',()=>{cancelEntity();message(entityStatus,'Entity lookup canceled.');});
  on('revoke-optional-access',()=>{cancelList();cancelEntity();});
  chrome.permissions.onRemoved.addListener(()=>{cancelList();cancelEntity();entityResults?.replaceChildren();});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes[LIST_KEY]){clearPreview();void refresh().catch(e=>message(status,e));}});
  void refresh().catch(e=>message(status,e));
}
