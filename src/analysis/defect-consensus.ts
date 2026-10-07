import type { EvidenceSignal } from '../types/evidence';

export interface DefectObservation {
  source:string;
  text:string;
  productKey?:string;
}

type DefectFamily={
  id:string;
  label:string;
  patterns:RegExp[];
  safety?:boolean;
};

const DEFECTS:DefectFamily[]=[
  {id:'breakage',label:'breaks or falls apart',patterns:[/\bbrok(?:e|en)\b/i,/\bfell apart\b/i,/\bfall(?:s|ing)? apart\b/i,/\bsnapped\b/i,/\bcracked\b/i]},
  {id:'overheat',label:'overheats or gets dangerously hot',safety:true,patterns:[/\boverheat(?:s|ed|ing)?\b/i,/\btoo hot to (?:touch|hold)\b/i,/\bburn(?:ed|ing)? smell\b/i,/\bsmok(?:e|ed|ing)\b/i,/\bcaught fire\b/i]},
  {id:'battery',label:'battery fails or swells',safety:true,patterns:[/\bbattery.{0,30}(?:swoll|swell|dead|fail)/i,/(?:swoll|swell).{0,30}\bbattery\b/i,/\bwon't hold (?:a )?charge\b/i]},
  {id:'leak',label:'leaks',patterns:[/\bleak(?:s|ed|ing)?\b/i,/\bnot watertight\b/i]},
  {id:'material',label:'material does not match the sales pitch',patterns:[/\bcheap (?:plastic|material|fabric|metal)\b/i,/\bnot (?:real|genuine) (?:leather|wood|metal)\b/i,/\bmaterial.{0,30}not as described\b/i]},
  {id:'seams',label:'stitching or seams fail',patterns:[/\bstitch(?:ing|es).{0,30}(?:broke|loose|poor|bad|fail)/i,/\bseam(?:s)?.{0,30}(?:split|ripped|fail)/i,/\bfray(?:ed|ing)?\b/i]},
  {id:'missing-parts',label:'arrives with parts missing',patterns:[/\bmissing (?:a |the )?(?:part|piece|screw|accessory)/i,/\bparts? missing\b/i]},
  {id:'early-failure',label:'fails soon after purchase',patterns:[/\bstopped working.{0,40}(?:day|week|month)/i,/\bdied after.{0,30}(?:day|week|month|use)/i,/\bfailed after.{0,30}(?:day|week|month|use)/i]},
  {id:'wrong-item',label:'arrives different from the listing',patterns:[/\bnot as described\b/i,/\bdifferent (?:product|item)\b/i,/\bwrong (?:product|item|model)\b/i]},
];

function normalizeSource(value:string):string{return value.trim().toLowerCase();}

export function defectConsensusEvidence(observations:DefectObservation[]):EvidenceSignal[]{
  const unique=new Map<string,DefectObservation>();
  for(const observation of observations){
    const source=normalizeSource(observation.source);
    const text=observation.text.replace(/\s+/g,' ').trim();
    if(!source||text.length<8) continue;
    unique.set(source+'|'+text.toLowerCase().slice(0,300),{...observation,source,text});
  }

  const out:EvidenceSignal[]=[];
  for(const family of DEFECTS){
    const matches=[...unique.values()].filter(o=>family.patterns.some(p=>p.test(o.text)));
    const sources=new Set(matches.map(m=>m.source));
    if(matches.length<2||sources.size<2) continue;

    const strong=sources.size>=3&&matches.length>=4;
    out.push({
      id:`DEFECT_CONSENSUS_${family.id.toUpperCase().replace(/-/g,'_')}`,
      family:family.safety?'safety':'quality',
      severity:strong?'strong':'moderate',
      confidence:strong?.88:.74,
      weight:family.safety?(strong?24:15):(strong?18:10),
      title:family.safety
        ? `Safety complaints keep coming up: ${family.label}`
        : `Buyers keep saying it ${family.label}`,
      explanation:strong
        ? `The same problem shows up repeatedly across ${sources.size} different sources.`
        : `The same problem shows up on more than one outside source.`,
      observedValue:`${matches.length} matching complaint(s) across ${sources.size} source(s)`,
      independentKey:`defect-consensus:${family.id}`,
    });
  }
  return out;
}
