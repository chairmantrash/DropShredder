import {tr,errorText} from '../i18n/index';
import type {DropShredderReport} from '../types/report';
import {lookupDomain,validOutsideResult,type OutsideResult} from '../reputation/outside-results';
import {consumerRecordLinks} from '../reputation/consumer-links';
import {lookupUrlscan,URLSCAN_ORIGIN} from '../osint/urlscan';

export function mountOutsideResultControls(getReport:()=>DropShredderReport|undefined,apply:(r:DropShredderReport)=>void,guard:()=>Promise<boolean>,doc:Document=document){
  const get=<T extends HTMLElement>(id:string)=>doc.getElementById(id) as T|null;
  const status=get<HTMLElement>('outside-status'),results=get<HTMLElement>('outside-results'),links=get<HTMLElement>('consumer-record-links');
  const cancel=get<HTMLButtonElement>('outside-cancel'),scam=get<HTMLButtonElement>('outside-scamferret'),security=get<HTMLButtonElement>('outside-security');
  let active:AbortController|undefined,stamp='';
  const stop=()=>{active?.abort();active=undefined;if(cancel)cancel.disabled=true;};
  const reset=()=>{stop();stamp='';results?.replaceChildren();links?.replaceChildren();if(status)status.textContent='';if(scam)scam.disabled=true;if(security)security.disabled=true;};
  const renderResults=(rows:OutsideResult[])=>{results?.replaceChildren();for(const r of rows.slice(0,4)){
    if(!validOutsideResult(r))continue;
    const row=doc.createElement('article');row.className='evidence-row';
    const title=doc.createElement('strong');title.textContent=r.provider;
    const outcome=doc.createElement('p');outcome.textContent=tr('Outside result: $1 • reported $2$3',r.outcome==='reported-concern'?tr('Provider reported a concern'):r.outcome==='no-listed-concern'?tr('No concern stated in this record'):tr('Unclassified'),r.reportedAt,r.stale?tr(' • HISTORICAL — not a current scan'):'');
    const note=doc.createElement('p');note.textContent=r.reason;note.dir='auto';
    const scope=doc.createElement('p');scope.textContent=r.scope==='security'?tr('Security report only; merchant delivery and product origin remain unverified.'):tr('Historical model opinion; current site and operator remain unverified.');
    row.append(title,outcome,note,scope);results?.append(row);
    // No hyperlinks to automated scam-rating/security services.
  }};
  const refresh=()=>{const r=getReport(),next=r?`${r.product.url}\n${r.product.capturedAt}`:'';
    if(next!==stamp){reset();stamp=next;if(r){for(const l of consumerRecordLinks(r.product.domain)){
      const a=doc.createElement('a');a.href=l.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=l.label;links?.append(a,doc.createElement('br'));
    }}}
    if(scam)scam.disabled=!r||Boolean(active);if(security)security.disabled=!r||Boolean(active);
    renderResults(r?.outsideResults??[]);
  };
  cancel?.addEventListener('click',()=>{stop();refresh();if(status)status.textContent=tr('Canceled.');});
  const lookup=(provider:'scamferret'|'security')=>{
    const report=getReport();if(!report||active)return;const domain=lookupDomain(report.product.domain),ctl=new AbortController();active=ctl;
    if(cancel)cancel.disabled=false;if(scam)scam.disabled=true;if(security)security.disabled=true;
    if(status)status.textContent=tr('Checking the chosen website only. Outside opinions do not change product scores.');
    const origin=provider==='scamferret'?'https://raw.githubusercontent.com/*':URLSCAN_ORIGIN;
    const permission=chrome.permissions.request({origins:[origin]});
    void permission.then(async allowed=>{
      if(active!==ctl||ctl.signal.aborted)return;
      if(!allowed){if(status)status.textContent=tr('Permission denied or canceled; no request sent.');return;}
      if(getReport()!==report||!await guard()||getReport()!==report)return;
      const signal=AbortSignal.any([ctl.signal,AbortSignal.timeout(12_000)]);
      const rows=provider==='security'?await lookupUrlscan(domain,signal):await(await import('../osint/scamferret-results')).lookupPublishedScamferret(domain,signal);
      if(active!==ctl||ctl.signal.aborted||getReport()!==report||!await guard()||getReport()!==report||!await chrome.permissions.contains({origins:[origin]}))return;
      const next={...report,outsideResults:[...(report.outsideResults??[]).filter(r=>r.provider!==(provider==='security'?'urlscan':'ScamFerret research')),...rows]};
      apply(next);
      if(status)status.textContent=rows.length?tr('Outside records: $1. Dates and scope are shown; product scores are unchanged.',rows.length):tr('No usable outside record. This does not mean the store is safe.');
    }).catch(e=>{if(active===ctl&&status)status.textContent=ctl.signal.aborted?tr('Canceled.'):errorText(e);})
      .finally(()=>{if(active===ctl){active=undefined;if(cancel)cancel.disabled=true;refresh();}});
  };
  scam?.addEventListener('click',()=>lookup('scamferret'));security?.addEventListener('click',()=>lookup('security'));
  chrome.permissions.onRemoved.addListener(({origins})=>{if(origins?.length)reset();});
  doc.getElementById('revoke-optional-access')?.addEventListener('click',reset);
  refresh();return {reset,refresh};
}
