import type { DropShredderReport } from '../types/report';
import type { ToneMode } from './tone';
import { toneCopy } from './tone';
import { publicEvidenceUrl } from '../security/public-url';

export interface ReportRenderTargets {
  summary:HTMLElement;
  evidenceList:HTMLElement;
  raw:HTMLElement;
}

export function renderShopperReport(report:DropShredderReport,targets:ReportRenderTargets,tone:ToneMode):void {
  const {summary,evidenceList,raw}=targets;
  const score=report.verdict.massResellLikelihood;
  summary.replaceChildren();
  const metric=(label:string,value:string)=>{
    const row=document.createElement('div');
    row.className='metric';
    const name=document.createElement('span');
    name.textContent=label;
    const result=document.createElement('strong');
    result.textContent=value;
    row.append(name,result);
    summary.append(row);
  };
  const subject=document.createElement('div');subject.className='gate report-subject';
  subject.textContent=`${report.product.title ?? 'Scanned listing'} • ${report.product.domain} • captured ${report.product.capturedAt}`;
  summary.append(subject);
  metric('Mass-resell evidence score',score===null?'UNKNOWN':score+'/100');
  metric('Dropship evidence score',report.verdict.dropshipLikelihood===null?'UNKNOWN':report.verdict.dropshipLikelihood+'/100');
  metric('Misleading claims',report.verdict.deceptionRisk.toUpperCase());
  metric('Store warning signs',report.verdict.merchantRisk.toUpperCase());
  metric('Review / sales tricks',report.verdict.manipulationRisk.toUpperCase());
  if(report.reviewIntegrity?.total){
    const review=report.reviewIntegrity;
    const note=document.createElement('div');
    note.className='gate';
    const ratings=review.displayedRating!==undefined && review.adjustedRating!==undefined
      ? ` Rating shown: ${review.displayedRating.toFixed(1)}; after flagged visible reviews: ${review.adjustedRating.toFixed(1)}.`
      : '';
    const complaints=review.commonComplaints.length
      ? ` Common low-star complaints: ${review.commonComplaints.map(item=>`${item.label} (${item.count})`).join(', ')}.`
      : '';
    note.textContent=`Review check: ${review.passed}/${review.total} visible reviews did not trigger our checks.${ratings}${complaints}`;
    summary.append(note);
  }
  metric('Shipping headaches',report.verdict.fulfillmentRisk.toUpperCase());
  metric('Where it appears to come from',report.supplyChain?.label ?? 'UNKNOWN');
  metric('Who handles the payment',report.supplyChain?.paymentChainLabel ?? 'UNKNOWN');
  for(const message of ['Scores summarize detected evidence; they are not measured probabilities or product-quality ratings.',report.supplyChain?.preferenceNote,report.verdict.reason]){
    if(!message) continue;
    const gate=document.createElement('div');
    gate.className='gate';
    gate.textContent=message;
    summary.append(gate);
  }

  evidenceList.replaceChildren();
  if(!report.evidence.length){
    const empty=document.createElement('div');
    empty.className='empty';
    empty.textContent=toneCopy(tone).noEvidence;
    evidenceList.append(empty);
  }else{
    for(const item of report.evidence.slice(0,300)){
      const row=document.createElement('article');
      row.className=`evidence-row severity-${item.severity}`;
      row.dataset.severity=item.severity;row.dataset.family=item.family;
      const head=document.createElement('div');
      head.className='evidence-head';
      const severity=document.createElement('span');
      severity.textContent=item.severity==='direct'?'DIRECT':item.severity==='strong'?'STRONG':item.severity==='moderate'?'WATCH THIS':item.severity==='weak'?'SMALL FLAG':'FYI';
      const title=document.createElement('strong');
      title.textContent=item.title;
      head.append(severity,title);
      const explanation=document.createElement('p');
      explanation.textContent=item.explanation;
      row.append(head,explanation);
      if(item.observedValue){
        const observed=document.createElement('code');
        observed.textContent=item.observedValue;
        row.append(observed);
      }
      const details=document.createElement('details');details.className='evidence-source';
      const label=document.createElement('summary');label.textContent='Source and method';details.append(label);
      const method=document.createElement('p');
      method.textContent=item.provenance
        ? `${item.provenance.method} • observed ${item.provenance.observedAt}`
        : 'This detector did not record a source URL or extraction method.';
      details.append(method);
      const source=publicEvidenceUrl(item.provenance?.sourceUrl);
      if(source){const link=document.createElement('a');link.href=source;link.target='_blank';link.rel='noopener noreferrer';
        link.textContent=`Open source: ${new URL(source).hostname}`;details.append(link);}
      row.append(details);evidenceList.append(row);
    }
  }
  if(report.evidence.length>300){const note=document.createElement('p');note.className='gate';
    note.textContent=`Showing the first 300 of ${report.evidence.length} items. Full scan details contain the remaining items.`;evidenceList.append(note);}
  raw.textContent=JSON.stringify(report,null,2);
  raw.hidden=false;
}
