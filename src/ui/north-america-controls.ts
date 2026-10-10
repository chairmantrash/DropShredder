import {tr} from '../i18n/index';
import {assessNorthAmerica,parseOriginDossier,type OriginDossier,type NorthAmericaAssessment} from '../analysis/north-america-origin';
import type {DropShredderReport} from '../types/report';
import {NORTH_AMERICA_DIRECTORY,NORTH_AMERICA_RELATIONSHIPS,regionalRecordFresh} from '../intelligence/north-america-directory';

export function mountNorthAmericaControls(getReport:()=>DropShredderReport|undefined,update:(assessment:NorthAmericaAssessment)=>void,guard:()=>Promise<boolean>,doc:Document=document):{reset:()=>void} {
  const file=doc.querySelector<HTMLInputElement>('#origin-file'),preview=doc.querySelector<HTMLElement>('#origin-preview');
  const apply=doc.querySelector<HTMLButtonElement>('#origin-apply'),review=doc.querySelector<HTMLInputElement>('#origin-reviewed');
  const status=doc.querySelector<HTMLElement>('#origin-status');
  let pending:OriginDossier|undefined,epoch=0;
  const reset=()=>{epoch++;pending=undefined;preview?.replaceChildren();if(apply)apply.disabled=true;if(review)review.checked=false;if(file)file.value='';if(status)status.textContent='';};
  file?.addEventListener('change',()=>{
    epoch++;pending=undefined;preview?.replaceChildren();if(apply)apply.disabled=true;if(review)review.checked=false;
    const generation=epoch,selected=file.files?.[0];if(!selected)return;
    if(selected.size>50_000){if(status)status.textContent=tr('Choose an origin JSON file smaller than 50 KB.');return;}
    void selected.text().then(input=>{
      if(generation!==epoch)return;pending=parseOriginDossier(input);
      for(const d of pending.documents){const row=doc.createElement('article');row.className='evidence-row';
        const p=doc.createElement('p');p.textContent=`${d.stage}: ${d.countries.join(', ')} • ${d.coverage} • ${d.kind} • ${d.observedAt} → ${d.expiresAt} • ${d.detail}`;p.dir='auto';
        const a=doc.createElement('a');a.href=d.sourceUrl;a.textContent=tr('Open source: $1',new URL(d.sourceUrl).hostname);a.target='_blank';a.rel='noopener noreferrer';row.append(p,a);preview?.append(row);
      }
      if(status)status.textContent=tr('Open and review the source documents, then apply to the current product. A file or signature alone does not verify origin.');
    }).catch(()=>{if(generation===epoch){pending=undefined;if(status)status.textContent=tr('Invalid origin file. Check the schema and public source URLs.');}});
  });
  review?.addEventListener('change',()=>{if(apply)apply.disabled=!pending||!review.checked;});
  apply?.addEventListener('click',()=>{const current=pending,generation=epoch;if(!current||!review?.checked)return;
    void guard().then(allowed=>{const report=getReport();if(!allowed||!report||generation!==epoch||current!==pending){if(status)status.textContent=tr('Check the current product before applying origin evidence.');return;}
      const assessment=assessNorthAmerica(report.product,report.northAmerica?.claims??[],current,true);
      update(assessment);if(status)status.textContent=tr('Origin assessment applied. Seller warning scores are unchanged.');
    }).catch(()=>{if(status)status.textContent=tr('Check the current product before applying origin evidence.');});
  });
  doc.querySelector('#origin-clear')?.addEventListener('click',()=>{reset();const report=getReport();if(report)update(assessNorthAmerica(report.product,report.northAmerica?.claims??[]));});
  const directory=doc.querySelector('#origin-directory'),filter=doc.querySelector<HTMLSelectElement>('#origin-country');
  const renderDirectory=()=>{directory?.replaceChildren();
    for(const r of NORTH_AMERICA_DIRECTORY.filter(r=>!filter?.value||r.countries.includes(filter.value))){
      const row=doc.createElement('article');row.className='evidence-row';const title=doc.createElement('strong');title.textContent=r.name;title.dir='auto';
      const text=doc.createElement('p');text.textContent=`${r.countries.join(' / ')} • ${r.kind} • ${r.summary} ${r.limit}`;text.dir='auto';
      const date=doc.createElement('p');date.textContent=tr('Reviewed $1 • $2',r.reviewedAt,regionalRecordFresh(r)?tr('Current reference window'):tr('Stale reference — recheck source'));
      const link=doc.createElement('a');link.href=r.sourceUrl;link.textContent=tr('Open source: $1',new URL(r.sourceUrl).hostname);link.target='_blank';link.rel='noopener noreferrer';
      row.append(title,text,date,link);
      for(const e of NORTH_AMERICA_RELATIONSHIPS.filter(e=>e.fromId===r.id)){const p=doc.createElement('p');p.textContent=`${e.relation} → ${NORTH_AMERICA_DIRECTORY.find(n=>n.id===e.toId)?.name}`;const a=doc.createElement('a');a.href=e.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent=tr('Open source: $1',new URL(e.sourceUrl).hostname);p.append(' ',a);row.append(p);}
      directory?.append(row);
    }
  };
  filter?.addEventListener('change',renderDirectory);
  // Populate only when explicitly expanded; no remote requests or automatic browsing.
  doc.querySelector('#regional-directory-panel')?.addEventListener('toggle',event=>{if((event.target as HTMLDetailsElement).open)renderDirectory();});
  return {reset};
}
