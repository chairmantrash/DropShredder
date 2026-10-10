import { tr } from '../i18n/index';
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
    name.textContent=tr(label);
    const result=document.createElement('strong');
    result.textContent=tr(value);
    row.append(name,result);
    summary.append(row);
  };
  const subject=document.createElement('div');subject.className='gate report-subject';
  subject.textContent=tr('$1 • $2 • captured $3',report.product.title??tr('Scanned listing'),report.product.domain,report.product.capturedAt);
  subject.dir='auto';summary.append(subject);
  metric(tr('Mass-resell evidence score'),score===null?'UNKNOWN':score+'/100');
  metric(tr('Dropship evidence score'),report.verdict.dropshipLikelihood===null?'UNKNOWN':report.verdict.dropshipLikelihood+'/100');
  metric(tr('Misleading claims'),report.verdict.deceptionRisk.toUpperCase());
  metric(tr('Store warning signs'),report.verdict.merchantRisk.toUpperCase());
  metric(tr('Review / sales tricks'),report.verdict.manipulationRisk.toUpperCase());
  if(report.reviewIntegrity?.total){
    const review=report.reviewIntegrity;
    const note=document.createElement('div');
    note.className='gate';
    const ratings=review.displayedRating!==undefined && review.adjustedRating!==undefined
      ? ' '+tr('Rating shown: $1; after flagged visible reviews: $2.',review.displayedRating.toFixed(1),review.adjustedRating.toFixed(1))
      : '';
    const complaints=review.commonComplaints.length
      ? ' '+tr('Common low-star complaints: $1.',review.commonComplaints.map(item=>`${item.label} (${item.count})`).join(', '))
      : '';
    note.textContent=tr('Review check: $1/$2 visible reviews did not trigger our checks.$3$4',review.passed,review.total,ratings,complaints);
    summary.append(note);
  }
  metric(tr('Shipping headaches'),report.verdict.fulfillmentRisk.toUpperCase());
  metric(tr('Where it appears to come from'),report.supplyChain?.label ?? 'UNKNOWN');
  metric(tr('Who handles the payment'),report.supplyChain?.paymentChainLabel ?? 'UNKNOWN');
  for(const message of [tr('Scores summarize detected evidence; they are not measured probabilities or product-quality ratings.'),report.supplyChain?.preferenceNote,report.verdict.reason]){
    if(!message) continue;
    const gate=document.createElement('div');
    gate.className='gate';
    gate.textContent=tr(message);gate.dir='auto';
    summary.append(gate);
  }

  evidenceList.replaceChildren();
  if(report.evidence.length){const note=document.createElement('p');note.className='scan-disclosure';note.textContent=tr('Detector notes (original language)');evidenceList.append(note);}
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
      severity.textContent=item.severity==='direct'?tr('DIRECT'):item.severity==='strong'?tr('STRONG'):item.severity==='moderate'?tr('WATCH THIS'):item.severity==='weak'?tr('SMALL FLAG'):tr('FYI');
      const title=document.createElement('strong');
      title.textContent=item.title;title.dir='auto';
      head.append(severity,title);
      const explanation=document.createElement('p');
      explanation.textContent=item.explanation;explanation.dir='auto';
      row.append(head,explanation);
      if(item.observedValue){
        const observed=document.createElement('code');
        observed.textContent=item.observedValue;observed.dir='auto';
        row.append(observed);
      }
      const details=document.createElement('details');details.className='evidence-source';
      const label=document.createElement('summary');label.textContent=tr('Source and method');details.append(label);
      const method=document.createElement('p');
      method.textContent=item.provenance
        ? tr('$1 • observed $2',item.provenance.method,item.provenance.observedAt)
        : tr('This detector did not record a source URL or extraction method.');
      details.append(method);
      const source=publicEvidenceUrl(item.provenance?.sourceUrl);
      if(source){const link=document.createElement('a');link.href=source;link.target='_blank';link.rel='noopener noreferrer';
        link.textContent=tr('Open source: $1',new URL(source).hostname);details.append(link);}
      row.append(details);evidenceList.append(row);
    }
  }
  if(report.evidence.length>300){const note=document.createElement('p');note.className='gate';
    note.textContent=tr('Showing the first 300 of $1 items. Full scan details contain the remaining items.',report.evidence.length);evidenceList.append(note);}
  raw.textContent=JSON.stringify(report,null,2);
  raw.hidden=false;
}
