import { publicEvidenceUrl } from '../security/public-url';
import { normalizeGtin } from '../analysis/product-identity';
import { fetchBoundedJson } from '../osint/bounded-json';

export const LIST_KEY='dropshredder-user-lists-v1';
export const MAX_LIST_BYTES=800_000;
export const WEEK_MS=7*24*60*60*1000;
export interface EntityLead {role:'manufacturer'|'importer'|'seller';name:string;identifier?:string;sourceUrl:string;observedAt:string}
export interface ProductLead {id:string;url:string;title:string;gtin?:string;brand?:string;mpn?:string;attributes:Record<string,string>;entities:EntityLead[]}
export interface UserList {schemaVersion:1;id:string;title:string;sourceUrl:string;license:string;publishedAt:string;expiresAt:string;version:number;records:ProductLead[]}
export interface PublisherKey {sourceUrl:string;keyId:string;issuer:string;publicKey:string}
export interface ListPreview {list:UserList;authentication:'unsigned'|'user-pinned-key';keyId?:string;stale:boolean}
export interface SavedList {current:ListPreview;previous?:ListPreview;subscriptionUrl?:string;checkedAt:string;highestVersion:number}
export interface ListStore {schemaVersion:1;lists:SavedList[];keys:PublisherKey[]}
const object=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v)) throw new Error('Expected a JSON object.');return v as Record<string,unknown>;};
const text=(v:unknown,max:number)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u001f\u007f]/.test(v)) throw new Error('Invalid or oversized text field.');return v.trim();};
const jsonText=(v:unknown,max:number)=>{if(typeof v!=='string'||!v.length||v.length>max) throw new Error('Invalid or oversized JSON.');return v;};
const fields=(v:Record<string,unknown>,allowed:string[])=>{if(Object.keys(v).some(k=>!allowed.includes(k))) throw new Error('Unsupported data field; lists cannot contain rules, scores or executable code.');};
export function feedUrl(v:unknown):string{
  const value=text(v,2048),safe=publicEvidenceUrl(value);
  if(!safe||new URL(value).search||new URL(value).hash) throw new Error('Use a public HTTPS URL without credentials, query or fragment.');
  return safe;
}
const date=(v:unknown)=>{const value=text(v,40);if(!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value))) throw new Error('Use an ISO timestamp.');return value;};
const id=(v:unknown)=>{const value=text(v,80);if(!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error('Invalid record or publisher ID.');return value;};
export function validateUserList(value:unknown,now=Date.now()):UserList{
  const p=object(value);fields(p,['schemaVersion','id','title','sourceUrl','license','publishedAt','expiresAt','version','records']);
  if(p.schemaVersion!==1||!Number.isSafeInteger(p.version)||Number(p.version)<1) throw new Error('Unsupported schema or version.');
  const publishedAt=date(p.publishedAt),expiresAt=date(p.expiresAt),start=Date.parse(publishedAt),end=Date.parse(expiresAt);
  if(start>now+300_000||end<=start||end-start>90*24*60*60*1000) throw new Error('Invalid publication or expiry window (maximum 90 days).');
  if(!Array.isArray(p.records)||p.records.length>500) throw new Error('A list can contain at most 500 records.');
  const seen=new Set<string>();
  const records=p.records.map(value=>{
    const r=object(value);fields(r,['id','url','title','gtin','brand','mpn','attributes','entities']);
    const recordId=id(r.id);if(seen.has(recordId)) throw new Error('Duplicate record ID.');seen.add(recordId);
    const attributes:Record<string,string>={};
    if(r.attributes!==undefined){const a=object(r.attributes);fields(a,['color','colour','size','capacity','material']);for(const [k,v] of Object.entries(a)) attributes[k]=text(v,100);}
    const entities:EntityLead[]=[];
    if(r.entities!==undefined){if(!Array.isArray(r.entities)||r.entities.length>6) throw new Error('At most six separate entity roles per record.');
      for(const value of r.entities){const e=object(value);fields(e,['role','name','identifier','sourceUrl','observedAt']);
        if(!['manufacturer','importer','seller'].includes(String(e.role))) throw new Error('Unsupported entity role.');
        const observedAt=date(e.observedAt);if(Date.parse(observedAt)>now+300_000) throw new Error('Future entity observation.');
        entities.push({role:e.role as EntityLead['role'],name:text(e.name,150),identifier:e.identifier===undefined?undefined:text(e.identifier,100),sourceUrl:feedUrl(e.sourceUrl),observedAt});}}
    const gtin=r.gtin===undefined?undefined:text(r.gtin,40);if(gtin&&!normalizeGtin(gtin)) throw new Error('Invalid GTIN check digit.');
    const brand=r.brand===undefined?undefined:text(r.brand,100),mpn=r.mpn===undefined?undefined:text(r.mpn,100);
    if(!gtin && !(brand&&mpn)) throw new Error('Each product needs a valid GTIN or both brand and model.');
    return {id:recordId,url:feedUrl(r.url),title:text(r.title,300),gtin,brand,mpn,attributes,entities};
  });
  return {schemaVersion:1,id:id(p.id),title:text(p.title,150),sourceUrl:feedUrl(p.sourceUrl),license:text(p.license,150),publishedAt,expiresAt,version:Number(p.version),records};
}
const base64=(value:string)=>{if(!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Expected base64url key/signature.');const bytes=Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));return bytes;};
export function validatePublisherKey(value:unknown):PublisherKey{
  const p=object(value);fields(p,['sourceUrl','keyId','issuer','publicKey']);const publicKey=text(p.publicKey,60);
  if(base64(publicKey).length!==32) throw new Error('Ed25519 public keys must be 32 bytes.');
  return {sourceUrl:feedUrl(p.sourceUrl),keyId:id(p.keyId),issuer:text(p.issuer,150),publicKey};
}
export async function previewList(input:string,keys:PublisherKey[]=[],expectedUrl?:string,now=Date.now()):Promise<ListPreview>{
  if(new TextEncoder().encode(input).byteLength>MAX_LIST_BYTES) throw new Error('List exceeds 800 KB.');
  const value=object(JSON.parse(input));let payload:unknown=value,authentication:ListPreview['authentication']='unsigned',keyId:string|undefined;
  if(value.payload!==undefined){fields(value,['payload','signature']);const body=jsonText(value.payload,MAX_LIST_BYTES),sig=object(value.signature);fields(sig,['keyId','value']);
    payload=JSON.parse(body);const source=feedUrl(object(payload).sourceUrl);keyId=id(sig.keyId);
    const trusted=keys.find(k=>k.keyId===keyId&&k.sourceUrl===source);
    if(!trusted) throw new Error('Unknown publisher key. Pin an independently obtained key before using a signed list.');
    const signature=base64(text(sig.value,100));if(signature.length!==64) throw new Error('Invalid signature size.');
    const key=await crypto.subtle.importKey('raw',base64(trusted.publicKey),{name:'Ed25519'},false,['verify']);
    if(!await crypto.subtle.verify('Ed25519',key,signature,new TextEncoder().encode(body))) throw new Error('Publisher signature did not verify.');
    authentication='user-pinned-key';
  }
  const list=validateUserList(payload,now);
  if(expectedUrl&&list.sourceUrl!==feedUrl(expectedUrl)) throw new Error('Feed source URL does not match the authorized URL.');
  return {list,authentication,keyId,stale:Date.parse(list.expiresAt)<=now};
}
/** Network begins only from an explicit button click. Downloads never automatically replace a list. */
export async function fetchListPreview(url:string,keys:PublisherKey[],signal:AbortSignal):Promise<{preview:ListPreview;input:string}|undefined>{
  const source=feedUrl(url),origin=new URL(source).origin+'/*';signal.throwIfAborted();
  const consent=chrome.permissions.request({origins:[origin]});
  if(!await consent) return undefined;signal.throwIfAborted();
  const body=await fetchBoundedJson(source,AbortSignal.any([signal,AbortSignal.timeout(8000)]),MAX_LIST_BYTES);
  if(!await chrome.permissions.contains({origins:[origin]})) return undefined;
  const input=JSON.stringify(body);return {preview:await previewList(input,keys,source),input};
}
export function normalizeListStore(value:unknown):ListStore{
  const empty:ListStore={schemaVersion:1,lists:[],keys:[]};
  try{
    const p=object(value);if(p.schemaVersion!==1||!Array.isArray(p.lists)||p.lists.length>5||!Array.isArray(p.keys)||p.keys.length>10) return empty;
    const keys=p.keys.map(validatePublisherKey),lists:SavedList[]=[];
    for(const value of p.lists){try{const r=object(value),c=object(r.current);const list=validateUserList(c.list);
      const current:ListPreview={list,authentication:'unsigned',stale:Date.parse(list.expiresAt)<=Date.now()};
      // Persisted trust claims are never sufficient. Runtime matches are always unscored leads.
      let previous:ListPreview|undefined;if(r.previous){const old=validateUserList(object(r.previous).list);previous={list:old,authentication:'unsigned',stale:Date.parse(old.expiresAt)<=Date.now()};}
      if(lists.some(x=>x.current.list.id===list.id)) continue;
      lists.push({current,previous,subscriptionUrl:r.subscriptionUrl===undefined?undefined:feedUrl(r.subscriptionUrl),checkedAt:date(r.checkedAt),highestVersion:Math.max(list.version,Number.isSafeInteger(r.highestVersion)?Number(r.highestVersion):list.version)});
    }catch{/* Corruption is ignored, never promoted. */}}
    return {schemaVersion:1,keys,lists};
  }catch{return empty;}
}
export async function loadUserLists():Promise<ListStore>{const stored=await chrome.storage.local.get(LIST_KEY);return normalizeListStore(stored[LIST_KEY]);}
let writes:Promise<unknown>=Promise.resolve();
export function applyListMutation(action:unknown):Promise<ListStore>{
  const a=object(action);fields(a,['type','input','id','subscriptionUrl']);const type=a.type;
  const task=writes.then(async()=>{
    const store=await loadUserLists();
    if(type==='clear'){store.lists=[];store.keys=[];}
    else if(type==='pin'){const key=validatePublisherKey(JSON.parse(jsonText(a.input,2000)));store.keys=store.keys.filter(k=>!(k.sourceUrl===key.sourceUrl&&k.keyId===key.keyId));if(store.keys.length>=10) throw new Error('At most ten publisher keys.');store.keys.push(key);}
    else if(type==='remove'){store.lists=store.lists.filter(x=>x.current.list.id!==id(a.id));}
    else if(type==='rollback'){const row=store.lists.find(x=>x.current.list.id===id(a.id));if(!row?.previous) throw new Error('No earlier list version.');[row.current,row.previous]=[row.previous,row.current];}
    else if(type==='save'){
      const preview=await previewList(jsonText(a.input,MAX_LIST_BYTES),store.keys);
      if(preview.stale) throw new Error('Expired lists cannot be activated.');
      const source=a.subscriptionUrl===undefined?undefined:feedUrl(a.subscriptionUrl);
      if(source&&source!==preview.list.sourceUrl) throw new Error('Subscription source does not match.');
      const old=store.lists.find(x=>x.current.list.id===preview.list.id);
      if(old&&(old.current.list.sourceUrl!==preview.list.sourceUrl||preview.list.version<=old.highestVersion)) throw new Error('Source changed or version did not increase. Remove the list to start a different source.');
      if(!old&&store.lists.length>=5) throw new Error('At most five local lists.');
      store.lists=store.lists.filter(x=>x!==old);store.lists.push({current:preview,previous:old?.current,subscriptionUrl:source,checkedAt:new Date().toISOString(),highestVersion:preview.list.version});
    }else throw new Error('Unknown list action.');
    await chrome.storage.local.set({[LIST_KEY]:store});return store;
  });writes=task.catch(()=>{});return task;
}
export async function mutateUserLists(action:unknown):Promise<ListStore>{
  const result=await chrome.runtime.sendMessage({type:'DS_LIST_MUTATION',version:1,action});if(!result?.ok) throw new Error(result?.error??'Could not update local lists.');return normalizeListStore(result.store);
}
