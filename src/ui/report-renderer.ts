import type { DropShredderReport } from '../types/report';
import type { ToneMode } from './tone';
import { toneCopy } from './tone';

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
  metric('Likely sold all over the web',score===null?'UNKNOWN':score+'%');
  metric('Likely dropshipped',report.verdict.dropshipLikelihood===null?'UNKNOWN':report.verdict.dropshipLikelihood+'%');
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
  for(const message of [report.supplyChain?.preferenceNote,report.verdict.reason]){
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
    for(const item of report.evidence){
      const row=document.createElement('article');
      row.className=`evidence-row severity-${item.severity}`;
      const head=document.createElement('div');
      head.className='evidence-head';
      const severity=document.createElement('span');
      severity.textContent=item.severity==='strong'?'STRONG':item.severity==='moderate'?'WATCH THIS':item.severity==='weak'?'SMALL FLAG':'FYI';
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
      evidenceList.append(row);
    }
  }
  raw.textContent=JSON.stringify(report,null,2);
  raw.hidden=false;
}
