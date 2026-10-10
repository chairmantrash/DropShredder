import { tr, errorText } from '../i18n/index';
import { LIST_KEY, MAX_LIST_BYTES, WEEK_MS, fetchListPreview, loadUserLists, mutateUserLists, previewList, validatePublisherKey, type ListPreview, type ListStore } from '../intelligence/user-lists';
import { lookupLegalEntity } from '../osint/gleif';
import { loadFeatureSettings, updateFeatureSettings } from '../settings/features';

export function mountIntelligenceControls(doc:Document=document):void{
  const get=<T extends HTMLElement>(id:string)=>doc.getElementById(id) as T|null;
  const status=get<HTMLElement>('list-status'),preview=get<HTMLElement>('list-preview'),saved=get<HTMLElement>('saved-lists');
  const file=get<HTMLInputElement>('list-file'),url=get<HTMLInputElement>('list-url'),save=get<HTMLButtonElement>('list-save');
  const weekly=get<HTMLInputElement>('list-auto-weekly'),weeklyStatus=get<HTMLElement>('list-weekly-status');
  const cancel=get<HTMLButtonElement>('list-cancel'),subscribe=get<HTMLInputElement>('list-subscribe');
  const keyInput=get<HTMLTextAreaElement>('publisher-key'),keyStatus=get<HTMLElement>('publisher-key-status'),pin=get<HTMLButtonElement>('publisher-pin');
  const entityInput=get<HTMLInputElement>('entity-lei'),entityStatus=get<HTMLElement>('entity-status'),entityResults=get<HTMLElement>('entity-results');
  const entityButton=get<HTMLButtonElement>('entity-lookup'),entityCancel=get<HTMLButtonElement>('entity-cancel');
  let store:ListStore={schemaVersion:1,lists:[],keys:[]},pending:{input:string;source?:string;preview:ListPreview}|undefined;
  let epoch=0,listRequest:AbortController|undefined,entityRequest:AbortController|undefined,pinnedInput:string|undefined;
  const message=(el:HTMLElement|null,value:unknown)=>{if(el) el.textContent=value instanceof Error?errorText(value):tr(String(value));};
  const on=(id:string,fn:()=>void)=>get(id)?.addEventListener('click',fn);
  const clearPreview=()=>{epoch++;pending=undefined;preview?.replaceChildren();if(save) save.disabled=true;};
  const cancelList=()=>{listRequest?.abort();listRequest=undefined;if(cancel) cancel.disabled=true;clearPreview();};
  const show=(result:ListPreview,input:string,source?:string)=>{
    pending={input,source,preview:result};preview?.replaceChildren();
    const list=result.list,heading=doc.createElement('p');
    heading.textContent=tr('$1 • version $2 • $3 records • published $4 • expires $5 • license $6 • $7',list.title,list.version,list.records.length,list.publishedAt,list.expiresAt,list.license,result.stale?tr('EXPIRED — cannot activate'):result.authentication==='user-pinned-key'?tr('Signature checked against your pinned key $1; facts remain unverified',result.keyId??''):tr('UNSIGNED — facts and publisher identity unverified'));
    const sourceLink=doc.createElement('a');sourceLink.href=list.sourceUrl;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sourceLink.textContent=list.sourceUrl;
    preview?.append(heading,sourceLink);
    for(const r of list.records.slice(0,20)){const row=doc.createElement('p');row.textContent=`${r.id}: ${r.title} • ${r.gtin??`${r.brand} / ${r.mpn}`} • ${r.url} • ${Object.entries(r.attributes).map(([k,v])=>`${k}: ${v}`).join(', ')} • ${r.entities.map(e=>`${e.role}: ${e.name} (${e.sourceUrl}, ${e.observedAt})`).join('; ')}`;preview?.append(row);}
    if(list.records.length>20){const note=doc.createElement('p');note.textContent=tr('Preview shows the first 20 records. Review the full JSON before adding this list.');preview?.append(note);}
    if(save) save.disabled=result.stale;message(status,tr('Preview ready. Adding a list keeps it local and does not change warning thresholds.'));
  };
  weekly?.addEventListener('change',()=>{
    const wanted=weekly.checked;weekly.disabled=true;
    void updateFeatureSettings({weeklyIntelligenceUpdates:wanted}).then(()=>{
      message(weeklyStatus,wanted?tr('Weekly signed-feed checks enabled. Only previously authorized, signed, pinned-key subscriptions are eligible; no new permission prompts.'):tr('Automatic feed checks disabled; saved lists are unchanged.'));
    }).catch(e=>{weekly.checked=!wanted;message(weeklyStatus,e);}).finally(()=>{weekly.disabled=false;});
  });
  void loadFeatureSettings().then(settings=>{if(weekly) weekly.checked=settings.weeklyIntelligenceUpdates;}).catch(e=>message(weeklyStatus,e));
  const refresh=async()=>{
    store=await loadUserLists();saved?.replaceChildren();
    for(const row of store.lists){const section=doc.createElement('article');section.className='evidence-row';const label=doc.createElement('p');
      label.textContent=tr('$1 • v$2 • $3 records • $4$5',row.current.list.title,row.current.list.version,row.current.list.records.length,row.current.stale?tr('expired; matching disabled'):tr('reference leads only'),row.subscriptionUrl&&Date.now()-Date.parse(row.checkedAt)>=WEEK_MS?tr(' • weekly refresh due'):'');section.append(label);
      const button=(label:string,action:()=>Promise<unknown>)=>{const b=doc.createElement('button');b.className='secondary';b.textContent=tr(label);b.addEventListener('click',()=>{b.disabled=true;void action().then(()=>refresh()).catch(e=>message(status,e)).finally(()=>{b.disabled=false;});});section.append(b);};
      button('Remove',()=>mutateUserLists({type:'remove',id:row.current.list.id}));
      if(row.previous) button(tr('Restore previous version'),()=>mutateUserLists({type:'rollback',id:row.current.list.id}));
      if(row.subscriptionUrl){const choose=doc.createElement('button');choose.className='secondary';choose.textContent=tr('Select feed for refresh');choose.addEventListener('click',()=>{cancelList();if(url) url.value=row.subscriptionUrl!;if(subscribe) subscribe.checked=true;message(status,tr('Feed selected. Click Fetch preview to request a new copy; no request has been sent.'));});section.append(choose);}
      saved?.append(section);
    }
    if(!store.lists.length) message(saved,tr('No user-added lists.'));
  };
  file?.addEventListener('change',()=>{
    cancelList();const selected=file.files?.[0];if(!selected) return;const generation=epoch;
    if(selected.size>MAX_LIST_BYTES){message(status,tr('Choose a JSON file smaller than 800 KB.'));return;}
    void selected.text().then(async input=>{const result=await previewList(input,store.keys);if(generation===epoch) show(result,input);}).catch(e=>{if(generation===epoch) message(status,e);});
  });
  url?.addEventListener('input',cancelList);subscribe?.addEventListener('change',()=>{if(pending&&!pending.source&&subscribe.checked){subscribe.checked=false;message(status,tr('Fetch a feed preview before saving a subscription.'));}});
  on('list-fetch',()=>{
    cancelList();const generation=epoch,active=new AbortController();listRequest=active;if(cancel) cancel.disabled=false;message(status,tr('Requesting access to the feed you chose…'));
    // No asynchronous storage read before the user-gesture permission request.
    void fetchListPreview(url?.value??'',store.keys,active.signal).then(result=>{
      if(generation!==epoch||listRequest!==active) return;if(!result){message(status,tr('Access was not granted or was removed. No list activated.'));return;}
      show(result.preview,result.input,result.preview.list.sourceUrl);
    }).catch(e=>{if(generation===epoch) message(status,active.signal.aborted?tr('Feed fetch canceled.'):e);}).finally(()=>{if(listRequest===active){listRequest=undefined;if(cancel) cancel.disabled=true;}});
  });
  on('list-cancel',()=>{cancelList();message(status,tr('Feed fetch canceled.'));});
  on('list-save',()=>{const current=pending;if(!current||!save) return;save.disabled=true;
    void mutateUserLists({type:'save',input:current.input,...(subscribe?.checked&&current.source?{subscriptionUrl:current.source}:{})})
      .then(()=>{clearPreview();message(status,tr('List added locally. Automatic updates require separate opt-in and an independently pinned signing key; unsigned feeds stay manual.'));return refresh();})
      .catch(e=>{message(status,e);if(pending===current) save.disabled=current.preview.stale;});
  });
  on('list-clear',()=>{cancelList();pinnedInput=undefined;if(pin) pin.disabled=true;void mutateUserLists({type:'clear'}).then(()=>{message(status,tr('User lists, previous versions, subscriptions and publisher keys removed.'));return refresh();}).catch(e=>message(status,e));});
  keyInput?.addEventListener('input',()=>{pinnedInput=undefined;if(pin) pin.disabled=true;});
  on('publisher-preview',()=>{pinnedInput=undefined;if(pin) pin.disabled=true;try{
    const input=keyInput?.value??'',key=validatePublisherKey(JSON.parse(input));
    void crypto.subtle.digest('SHA-256',new TextEncoder().encode(key.publicKey)).then(hash=>{
      if(keyInput?.value!==input) return;const fingerprint=[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
      message(keyStatus,tr('$1 / $2 • $3 • SHA-256 of base64url key: $4. Verify this key through an independent publisher channel. Pinning or replacing it is your trust decision; it does not validate allegations.',key.issuer,key.keyId,key.sourceUrl,fingerprint));pinnedInput=input;if(pin) pin.disabled=false;
    }).catch(e=>message(keyStatus,e));
  }catch(e){message(keyStatus,e);}});
  on('publisher-pin',()=>{if(!pinnedInput||keyInput?.value!==pinnedInput) return;const input=pinnedInput;if(pin) pin.disabled=true;
    void mutateUserLists({type:'pin',input}).then(()=>{pinnedInput=undefined;message(keyStatus,tr('Publisher key pinned. Re-preview signed feeds to verify with this key.'));return refresh();}).catch(e=>message(keyStatus,e));
  });
  on('entity-lookup',()=>{
    if(entityRequest) return;const active=new AbortController();entityRequest=active;if(entityButton) entityButton.disabled=true;if(entityCancel) entityCancel.disabled=false;
    entityResults?.replaceChildren();message(entityStatus,tr('Requesting the exact LEI you chose from GLEIF…'));
    void lookupLegalEntity(entityInput?.value??'',active.signal).then(result=>{
      if(entityRequest!==active) return;if(!result){message(entityStatus,tr('Access was not granted or was removed.'));return;}
      const p=doc.createElement('p');p.textContent=tr('$1 • LEI $2 • $3 • entity $4 • registration $5 • updated $6 • retrieved $7',result.name,result.lei,result.jurisdiction,result.status,result.registrationStatus,result.updatedAt??tr('not supplied'),result.retrievedAt);
      const a=doc.createElement('a');a.href=result.sourceUrl;a.textContent=tr('Original GLEIF record');a.target='_blank';a.rel='noopener noreferrer';entityResults?.append(p,a);
      message(entityStatus,tr('Legal identity record only. This does not link the entity to this seller, manufacturer or product, and does not establish safety or quality. GLEIF data: CC0; DropShredder is unaffiliated.'));
    }).catch(e=>{if(entityRequest===active) message(entityStatus,active.signal.aborted?tr('Entity lookup canceled.'):e);})
      .finally(()=>{if(entityRequest===active){entityRequest=undefined;if(entityButton) entityButton.disabled=false;if(entityCancel) entityCancel.disabled=true;}});
  });
  const cancelEntity=()=>{entityRequest?.abort();entityRequest=undefined;if(entityButton) entityButton.disabled=false;if(entityCancel) entityCancel.disabled=true;};
  on('entity-cancel',()=>{cancelEntity();message(entityStatus,tr('Entity lookup canceled.'));});
  on('revoke-optional-access',()=>{cancelList();cancelEntity();});
  chrome.permissions.onRemoved.addListener(()=>{cancelList();cancelEntity();entityResults?.replaceChildren();});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes[LIST_KEY]){clearPreview();void refresh().catch(e=>message(status,e));}});
  void refresh().catch(e=>message(status,e));
}
