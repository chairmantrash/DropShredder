export type EvidenceStrength='info'|'weak'|'moderate'|'strong';
export interface FusionEvidence {
  id:string;
  family:string;
  strength:EvidenceStrength;
  score:number;
  sourceKey:string;
  independenceKey:string;
}
export interface FusionResult {
  evidenceScore:number;
  independentFamilies:number;
  independentSources:number;
  verdict:'not-enough-data'|'clean-so-far'|'small-flags'|'suspicious'|'strong-red-flags';
  reasons:string[];
}

const cap=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));

export function fuseEvidence(items:FusionEvidence[], coverageFamilies:string[]):FusionResult{
  const valid=items.filter(x=>x.score>0&&x.sourceKey&&x.independenceKey&&x.family);
  const familyScores=new Map<string,number>();
  const familyIndependence=new Map<string,Set<string>>();
  for(const item of valid){
    const current=familyScores.get(item.family)??0;
    // Diminishing returns prevents twenty correlated clues from overpowering two independent families.
    familyScores.set(item.family,cap(current+(1-current)*cap(item.score)*.72));
    const keys=familyIndependence.get(item.family)??new Set<string>();
    keys.add(item.independenceKey);familyIndependence.set(item.family,keys);
  }
  const scored=[...familyScores.values()];
  const evidenceScore=scored.length?1-scored.reduce((remain,s)=>remain*(1-s),1):0;
  const independentFamilies=[...familyIndependence.entries()].filter(([,v])=>v.size>0).length;
  const independentSources=new Set(valid.map(x=>x.sourceKey)).size;
  const coverage=new Set(coverageFamilies).size;

  let verdict:FusionResult['verdict']='clean-so-far';
  const reasons:string[]=[];
  if(coverage<2&&valid.length===0){verdict='not-enough-data';reasons.push('Too little information was available to make a useful call.');}
  else if(evidenceScore>=.72&&independentFamilies>=2&&independentSources>=2){verdict='strong-red-flags';}
  else if(evidenceScore>=.48&&(independentFamilies>=2||independentSources>=2)){verdict='suspicious';}
  else if(evidenceScore>=.22){verdict='small-flags';}
  return {evidenceScore,independentFamilies,independentSources,verdict,reasons};
}
