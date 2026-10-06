import type { DropShredderReport } from '../types/report';

const DB_NAME='dropshredder';
const DB_VERSION=1;
const STORE='observations';

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
      if (!db.objectStoreNames.contains(STORE)) {
        const store=db.createObjectStore(STORE,{keyPath:'id'});
        store.createIndex('identityKey','identityKey',{unique:false});
        store.createIndex('capturedAt','capturedAt',{unique:false});
        store.createIndex('domain','domain',{unique:false});
      }
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

export function productIdentityKey(report: DropShredderReport): string {
  const p=report.product;
  return p.gtin
    ? `gtin:${p.gtin}`
    : p.mpn && p.brand
      ? `brand-mpn:${p.brand.toLowerCase()}|${p.mpn.toLowerCase()}`
      : p.canonicalUrl
        ? `url:${p.canonicalUrl}`
        : `domain-title:${p.domain}|${(p.title ?? '').toLowerCase().slice(0,180)}`;
}

export async function saveObservation(report: DropShredderReport): Promise<StoredObservation> {
  const observation: StoredObservation={
    id:crypto.randomUUID(),
    identityKey:productIdentityKey(report),
    capturedAt:report.product.capturedAt,
    domain:report.product.domain,
    url:report.product.url,
    title:report.product.title,
    price:report.product.price,
    currency:report.product.currency,
    report,
  };
  const db=await openDb();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).add(observation);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
  db.close();
  return observation;
}

export async function getRecentObservationsAll(limit=250): Promise<StoredObservation[]> {
  const db=await openDb();
  const rows=await new Promise<StoredObservation[]>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const request=tx.objectStore(STORE).getAll();
    request.onsuccess=()=>resolve((request.result as StoredObservation[])
      .sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt))
      .slice(0,limit));
    request.onerror=()=>reject(request.error);
  });
  db.close();
  return rows;
}

export async function getObservations(identityKey:string,limit=100): Promise<StoredObservation[]> {
  const db=await openDb();
  const rows=await new Promise<StoredObservation[]>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const index=tx.objectStore(STORE).index('identityKey');
    const request=index.getAll(IDBKeyRange.only(identityKey));
    request.onsuccess=()=>resolve((request.result as StoredObservation[])
      .sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt))
      .slice(0,limit));
    request.onerror=()=>reject(request.error);
  });
  db.close();
  return rows;
}
