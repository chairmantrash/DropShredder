import {tr} from '../i18n/index';
import {assessBusinessStanding,parseStandingDossier,STANDING_SOURCES,type StandingDossier,type StandingTarget,type StandingAssessment} from '../reputation/business-standing';
import {regionalRecordFresh} from '../intelligence/north-america-directory';
import {publicEvidenceUrl} from '../security/public-url';

export function standingRatingText(a:StandingAssessment):string {
 switch(a.rating){
  case 'FAVORABLE':return tr('Favorable evidence in reviewed sources');
  case 'ADVERSE_RECORD':return tr('Adverse record in reviewed sources');
  case 'MIXED':return tr('Mixed or unresolved standing');
  case 'INSUFFICIENT':return tr('Insufficient standing evidence');
  default:return tr('Standing not reviewed');
 }
}
export function mountStandingControls(getListing:()=>string|undefined,guard:()=>Promise<boolean>,doc:Document=document):{reset:()=>void} {
 const file=doc.querySelector<HTMLInputElement>('#standing-file'),name=doc.querySelector<HTMLInputElement>('#standing-name'),domain=doc.querySelector<HTMLInputElement>('#standing-domain');
 const role=doc.querySelector<HTMLSelectElement>('#standing-role'),review=doc.querySelector<HTMLInputElement>('#standing-reviewed'),apply=doc.querySelector<HTMLButtonElement>('#standing-apply');
 const status=doc.querySelector<HTMLElement>('#standing-status'),preview=doc.querySelector<HTMLElement>('#standing-preview'),result=doc.querySelector<HTMLElement>('#standing-result');
 let pending:StandingDossier|undefined,epoch=0;
 const reset=()=>{epoch++;pending=undefined;if(file)file.value='';if(review)review.checked=false;if(apply)apply.disabled=true;preview?.replaceChildren();result?.replaceChildren();if(status)status.textContent='';};
 const edit=()=>{epoch++;if(review)review.checked=false;if(apply)apply.disabled=true;result?.replaceChildren();};
 for(const input of [name,domain,role])input?.addEventListener('input',edit);
 file?.addEventListener('change',()=>{
  edit();pending=undefined;preview?.replaceChildren();const selected=file.files?.[0],generation=epoch;if(!selected)return;
  if(selected.size>40_000){if(status)status.textContent=tr('Invalid standing file. Check its size, schema and source scope.');return;}
  void selected.text().then(input=>{
   if(generation!==epoch)return;pending=parseStandingDossier(input);
   const identity=doc.createElement('p');identity.textContent=`${pending.target.role}: ${pending.target.legalName} • ${pending.target.domain} • ${pending.target.listingUrl}`;identity.dir='auto';preview?.append(identity);
   for(const r of pending.records){const row=doc.createElement('article');row.className='evidence-row';const p=doc.createElement('p');p.textContent=`${r.subjectName} • ${r.subjectDomain} • ${r.dimension} • ${r.outcome} • ${r.grade??''} • ${r.recordId} • ${r.eventDate} / ${r.observedAt} • ${r.scope} • ${r.detail}${r.case?' • '+[r.case.court,r.case.jurisdiction,r.case.partyRole,r.case.category].join(' • '):''}`;p.dir='auto';const a=doc.createElement('a');a.href=r.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent=tr('Open source: $1',new URL(r.sourceUrl).hostname);row.append(p,a);preview?.append(row);}
   if(status)status.textContent=tr('Open the records and confirm the exact legal entity and its relationship to this listing.');
  }).catch(()=>{if(generation===epoch){pending=undefined;if(status)status.textContent=tr('Invalid standing file. Check its size, schema and source scope.');}});
 });
 review?.addEventListener('change',()=>{if(apply)apply.disabled=!pending||!review.checked;});
 apply?.addEventListener('click',()=>{const current=pending,generation=epoch;if(!current||!review?.checked)return;
  const listing=getListing(),t:StandingTarget={legalName:name?.value.trim()??'',domain:domain?.value.trim().toLowerCase()??'',role:role?.value==='manufacturer'?'manufacturer':role?.value==='shipper'?'shipper':'merchant',listingUrl:publicEvidenceUrl(listing)??''};
  void guard().then(allowed=>{
   if(!allowed||epoch!==generation||!review.checked||pending!==current||getListing()!==listing){if(status)status.textContent=tr('Check the current product before assessing standing.');return;}
   const a=assessBusinessStanding(t,current,true);result?.replaceChildren();const title=doc.createElement('strong');title.textContent=standingRatingText(a);const counts=doc.createElement('p');counts.textContent=tr('$1 current records • $2 excluded records • $3 publisher families',a.currentRecords,a.excludedRecords,a.publisherFamilies);result?.append(title,counts);
   for(const dimension of a.dimensions){const p=doc.createElement('p');p.textContent=`${dimension.dimension}: ${dimension.records.length?dimension.records.map(r=>r.sourceId+' / '+r.outcome+(r.grade?' '+r.grade:'')).join(' • '):tr('Unknown')}`;p.dir='auto';result?.append(p);}
   if(status)status.textContent=tr('User-reviewed standing only. This does not certify products, trade compliance or future performance. Seller warning scores are unchanged.');
  }).catch(()=>{if(status)status.textContent=tr('Check the current product before assessing standing.');});
 });
 doc.querySelector('#standing-clear')?.addEventListener('click',reset);
 const filter=doc.querySelector<HTMLSelectElement>('#standing-filter'),directory=doc.querySelector('#standing-directory');
 const render=()=>{directory?.replaceChildren();for(const s of STANDING_SOURCES.filter(s=>!filter?.value||s.dimensions.includes(filter.value))){const row=doc.createElement('article');row.className='evidence-row';const title=doc.createElement('strong');title.textContent=s.name;const p=doc.createElement('p');p.textContent=`${s.dimensions.join(' / ')} • ${s.access} • ${s.summary} ${s.limit}`;p.dir='auto';const date=doc.createElement('p');date.textContent=tr('Reviewed $1 • $2',s.reviewedAt,regionalRecordFresh(s)?tr('Current reference window'):tr('Stale reference — recheck source'));const a=doc.createElement('a');a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=tr('Open source: $1',new URL(s.url).hostname);row.append(title,p,date,a);directory?.append(row);}};
 filter?.addEventListener('change',render);doc.querySelector('#standing-directory-panel')?.addEventListener('toggle',e=>{if((e.target as HTMLDetailsElement).open)render();});
 return {reset};
}
