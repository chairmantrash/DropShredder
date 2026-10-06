import type { DropShredderReport } from '../types/report';

const DB_NAME='dropshredder';
const DB_VERSION=2;
const STORE='observations';
const MAX_TOTAL_OBSERVATIONS=2000;
const MAX_IDENTITY_OBSERVATIONS=120;

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

function stripUrlSecrets(value:string|undefined):string|undefined{
  if(!value) return undefined;
  try{
    const url=new URL(value);
    return url.origin+url.pathname;
  }catch{
    return value.split(/[?#]/,1)[0]?.slice(0,500);
  }
}

function sanitizeReportForStorage(report:DropShredderReport):DropShredderReport{
  const product={
    ...report.product,
    url:stripUrlSecrets(report.product.url) ?? report.product.domain,
    canonicalUrl:stripUrlSecrets(report.product.canonicalUrl),
    imageUrls:report.product.imageUrls
      .map(url=>stripUrlSecrets(url))
      .filter((url):url is string=>Boolean(url))
      .slice(0,30),
    imageFingerprints:report.product.imageFingerprints?.map(fingerprint=>({
      ...fingerprint,
      url:stripUrlSecrets(fingerprint.url) ?? '',
    })),
  };
  return {...report,product};
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

async function pruneHistory(db:IDBDatabase,identityKey:string):Promise<void>{
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    const store=tx.objectStore(STORE);
    const total=store.count();

    total.onsuccess=()=>{
      const excess=Math.max(0,total.result-MAX_TOTAL_OBSERVATIONS);
      if(excess>0){
        let removed=0;
        const cursor=store.index('capturedAt').openCursor();
        cursor.onsuccess=()=>{
          const row=cursor.result;
          if(!row || removed>=excess) return;
          row.delete();
          removed++;
          row.continue();
        };
      }

      const lower=[identityKey,''];
      const upper=[identityKey,'\uffff'];
      let seen=0;
      const perIdentity=store.index('identityCapturedAt').openCursor(IDBKeyRange.bound(lower,upper),'prev');
      perIdentity.onsuccess=()=>{
        const row=perIdentity.result;
        if(!row) return;
        seen++;
        if(seen>MAX_IDENTITY_OBSERVATIONS) row.delete();
        row.continue();
      };
    };

    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error);
  });
}

export async function saveObservation(report: DropShredderReport): Promise<StoredObservation> {
  const storedReport=sanitizeReportForStorage(report);
  const observation: StoredObservation={
    id:crypto.randomUUID(),
    identityKey:productIdentityKey(storedReport),
    capturedAt:storedReport.product.capturedAt,
    domain:storedReport.product.domain,
    url:storedReport.product.url,
    title:storedReport.product.title,
    price:storedReport.product.price,
    currency:storedReport.product.currency,
    report:storedReport,
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
    const out:StoredObservation[]=[];
    const tx=db.transaction(STORE,'readonly');
    const request=tx.objectStore(STORE).index('capturedAt').openCursor(null,'prev');
    request.onsuccess=()=>{
      const cursor=request.result;
      if(!cursor || out.length>=limit){
        resolve(out);
        return;
      }
      out.push(cursor.value as StoredObservation);
      cursor.continue();
    };
    request.onerror=()=>reject(request.error);
  });
  db.close();
  return rows;
}

export async function getObservations(identityKey:string,limit=100): Promise<StoredObservation[]> {
  const db=await openDb();
  const rows=await new Promise<StoredObservation[]>((resolve,reject)=>{
    const out:StoredObservation[]=[];
    const tx=db.transaction(STORE,'readonly');
    const lower=[identityKey,''];
    const upper=[identityKey,'\uffff'];
    const request=tx.objectStore(STORE)
      .index('identityCapturedAt')
      .openCursor(IDBKeyRange.bound(lower,upper),'prev');
    request.onsuccess=()=>{
      const cursor=request.result;
      if(!cursor || out.length>=limit){
        resolve(out);
        return;
      }
      out.push(cursor.value as StoredObservation);
      cursor.continue();
    };
    request.onerror=()=>reject(request.error);
  });
  db.close();
  return rows;
}
