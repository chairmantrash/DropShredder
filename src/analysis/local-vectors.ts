/**
 * Deterministic 192-dimensional local subword-vector search.
 * Feature-hashing preserves fuzzy lexical identity (spelling, word forms)
 * without model downloads, hosted inference, page-history uploads or AI claims.
 * Scores are retrieval similarity, NEVER probabilities or fraud evidence.
 */
export const LOCAL_VECTOR_DIM=192;
const tokens=(v:string):string[]=>(v??'').normalize('NFKC').toLocaleLowerCase('en')
  .replace(/[\u200b-\u200d\u2060\ufeff]/g,'')
  .split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=3&&x.length<=35).slice(0,80);
export function localTextVector(value:string):Float32Array {
  const v=new Float32Array(LOCAL_VECTOR_DIM),terms=tokens(value.slice(0,2000));
  const important=new Set(terms.filter(x=>x.length>=4));
  for(const token of important){
    const features=[token,...Array.from({length:Math.max(0,token.length-2)},(_,i)=>token.slice(i,i+3))];
    for(const feature of features.slice(0,80)){
      let h=2166136261;
      for(let i=0;i<feature.length;i++) h=Math.imul(h^feature.charCodeAt(i),16777619);
      const index=(h>>>0)%LOCAL_VECTOR_DIM,sign=(h&512)?1:-1;
      v[index]=(v[index]??0)+sign*(feature===token?2:0.35);
    }
  }
  let magnitude=0;for(const n of v)magnitude+=n*n;
  if(magnitude>0){const norm=Math.sqrt(magnitude);for(let i=0;i<v.length;i++)v[i]=(v[i]??0)/norm;}
  return v;
}
export function localVectorSimilarity(a:string,b:string):number {
  const va=localTextVector(a),vb=localTextVector(b);
  let similarity=0,na=0,nb=0;
  for(let i=0;i<va.length;i++){similarity+=(va[i]??0)*(vb[i]??0);na+=(va[i]??0)**2;nb+=(vb[i]??0)**2;}
  return na&&nb?Math.max(0,Math.min(1,similarity)):0;
}
export function lexicalOverlap(a:string,b:string):number{
  const left=new Set(tokens(a)),right=new Set(tokens(b));
  if(left.size<4||right.size<4) return 0;
  let shared=0;
  for(const token of left)if(right.has(token))shared++;
  return shared/Math.max(left.size,right.size);
}
