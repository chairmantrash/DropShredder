import type { DropShredderReport } from '../types/report';
import { sanitizeUrlForStorage } from '../security/page-safety';

const DB_NAME='dropshredder';
const DB_VERSION=2;
const STORE='observations';
const MAX_OBSERVATIONS=2000;
const MAX_IDENTITY_OBSERVATIONS=120;
const MAX_AGE_MS=180*24*60*60*1000;

export interface StoredObservation {
  id: string;
  identityKey: string;
  capturedAt: string;
  domain: string;
  url: string;
  title?: string;
  price?: number;
  currency?: string;
  report: DropShredderReport;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      let store:IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE)) {
        store=db.createObjectStore(STORE,{keyPath:'id'});
        store.createIndex('identityKey','identityKey',{unique:false});
        store.createIndex('capturedAt','capturedAt',{unique:false});
        store.createIndex('domain','domain',{unique:false});
      }else{
        store=request.transaction!.objectStore(STORE);
      }
      if(!store.indexNames.contains('identityCapturedAt')){
        store.createIndex('identityCapturedAt',['identityKey','capturedAt'],{unique:false});
      }
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

function sanitizedReport(report:DropShredderReport):DropShredderReport{
  const product=report.product;
  const imageUrls=product.imageUrls
    .map(url=>sanitizeUrlForStorage(url))
    .filter((url):url is string=>Boolean(url));
  const imageFingerprints=(product.imageFingerprints ?? []).map(item=>({
    ...item,
    url:sanitizeUrlForStorage(item.url) ?? '',
  })).filter(item=>Boolean(item.url));

  return {
    ...report,
    product:{
      ...product,
      url:sanitizeUrlForStorage(product.url) ?? product.domain,
      canonicalUrl:sanitizeUrlForStorage(product.canonicalUrl),
      imageUrls:[...new Set(imageUrls)].slice(0,30),
      imageFingerprints,
    },
  };
}

export function productIdentityKey(report: DropShredderReport): string {
  const p=report.product;
  const canonical=sanitizeUrlForStorage(p.canonicalUrl);
  return p.gtin
    ? `gtin:${p.gtin}`
    : p.mpn && p.brand
      ? `brand-mpn:${p.brand.toLowerCase()}|${p.mpn.toLowerCase()}`
      : canonical
        ? `url:${canonical}`
        : `domain-title:${p.domain}|${(p.title ?? '').toLowerCase().slice(0,180)}`;
}

async function pruneHistory(db:IDBDatabase,identityKey:string):Promise<void>{
  const cutoff=new Date(Date.now()-MAX_AGE_MS).toISOString();

  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    const index=tx.objectStore(STORE).index('capturedAt');
    const request=index.openCursor(IDBKeyRange.upperBound(cutoff,true),'next');
    request.onsuccess=()=>{
      const cursor=request.result;
      if(!cursor) return;
      cursor.delete();
      cursor.continue();
    };
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });

  let identitySeen=0;
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    const index=tx.objectStore(STORE).index('identityCapturedAt');
    const request=index.openCursor(IDBKeyRange.bound([identityKey,''],[identityKey,'\uffff']),'prev');
    request.onsuccess=()=>{
      const cursor=request.result;
      if(!cursor) return;
      identitySeen++;
      if(identitySeen>MAX_IDENTITY_OBSERVATIONS) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });

  const count=await new Promise<number>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const request=tx.objectStore(STORE).count();
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  if(count<=MAX_OBSERVATIONS) return;

  let keep=0;
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    const index=tx.objectStore(STORE).index('capturedAt');
    const request=index.openCursor(null,'prev');
    request.onsuccess=()=>{
      const cursor=request.result;
      if(!cursor) return;
      keep++;
      if(keep>MAX_OBSERVATIONS) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
}

export async function saveObservation(report: DropShredderReport): Promise<StoredObservation> {
  const safeReport=sanitizedReport(report);
  const observation: StoredObservation={
    id:crypto.randomUUID(),
    identityKey:productIdentityKey(safeReport),
    capturedAt:safeReport.product.capturedAt,
    domain:safeReport.product.domain,
    url:safeReport.product.url,
    title:safeReport.product.title,
    price:safeReport.product.price,
    currency:safeReport.product.currency,
    report:safeReport,
  };
  const db=await openDb();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).add(observation);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
  await pruneHistory(db,observation.identityKey);
  db.close();
  return observation;
}

export async function getRecentObservationsAll(limit=250): Promise<StoredObservation[]> {
  const db=await openDb();
  const rows=await new Promise<StoredObservation[]>((resolve,reject)=>{
    const result:StoredObservation[]=[];
    const tx=db.transaction(STORE,'readonly');
    const request=tx.objectStore(STORE).index('capturedAt').openCursor(null,'prev');
    request.onsuccess=()=>{
      const cursor=request.result;
      if(!cursor || result.length>=limit) return;
      result.push(cursor.value as StoredObservation);
      cursor.continue();
    };
    tx.oncomplete=()=>resolve(result);
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
  db.close();
  return rows;
}

export async function getObservations(identityKey:string,limit=100): Promise<StoredObservation[]> {
  const db=await openDb();
  const rows=await new Promise<StoredObservation[]>((resolve,reject)=>{
    const result:StoredObservation[]=[];
    const tx=db.transaction(STORE,'readonly');
    const index=tx.objectStore(STORE).index('identityCapturedAt');
    const lower=[identityKey,''];
    const upper=[identityKey,'\uffff'];
    const request=index.openCursor(IDBKeyRange.bound(lower,upper),'prev');
    request.onsuccess=()=>{
      const cursor=request.result;
      if(!cursor || result.length>=limit) return;
      result.push(cursor.value as StoredObservation);
      cursor.continue();
    };
    tx.oncomplete=()=>resolve(result);
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
  db.close();
  return rows;
}


export async function clearObservationHistory():Promise<void>{
  const db=await openDb();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    const request=tx.objectStore(STORE).clear();
    request.onsuccess=()=>undefined;
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
  db.close();
}
