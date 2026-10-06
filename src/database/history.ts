import type { ProductSnapshot } from '../types/product';

const DB_NAME='dropshredder';
const DB_VERSION=1;
const STORE='observations';

export interface ProductObservation {
  id?: number;
  key: string;
  url: string;
  domain: string;
  capturedAt: string;
  title?: string;
  price?: number;
  currency?: string;
  seller?: string;
  scarcitySnippets: string[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(STORE)){
        const store=db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});
        store.createIndex('key','key',{unique:false});
        store.createIndex('capturedAt','capturedAt',{unique:false});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

export function observationKey(product: ProductSnapshot): string {
  return product.canonicalUrl || product.url.split('#')[0] || product.url;
}

export async function saveObservation(observation: ProductObservation): Promise<void> {
  const db=await openDb();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).add(observation);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
  db.close();
}

export async function getRecentObservations(key: string, limit=30): Promise<ProductObservation[]> {
  const db=await openDb();
  const rows=await new Promise<ProductObservation[]>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const index=tx.objectStore(STORE).index('key');
    const req=index.getAll(IDBKeyRange.only(key));
    req.onsuccess=()=>resolve((req.result as ProductObservation[])
      .sort((a,b)=>Date.parse(b.capturedAt)-Date.parse(a.capturedAt))
      .slice(0,limit));
    req.onerror=()=>reject(req.error);
  });
  db.close();
  return rows;
}

export async function clearHistory(): Promise<void> {
  const db=await openDb();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
  db.close();
}
