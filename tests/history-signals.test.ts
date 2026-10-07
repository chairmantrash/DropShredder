import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeHistory } from '../src/analysis/history-signals';
import type { DropShredderReport } from '../src/types/report';
import type { StoredObservation } from '../src/storage/history';

function report(at:string,scarcity?:string,price=30,reviews?:{total:number;rating:number}):DropShredderReport {
  return {
    version:1,
    product:{url:'https://shop.example/p',domain:'shop.example',title:'Widget',price,imageUrls:[],jsonLdProductCount:1,capturedAt:at,claims:[],pageSignals:[]},
    merchant:{domain:'shop.example'},
    evidence:scarcity?[{id:'SCARCITY',family:'scarcity',severity:'weak',confidence:.6,weight:3,title:scarcity,explanation:'Visible scarcity claim.',observedValue:scarcity,independentKey:'scarcity-visible'}]:[],
    contradictions:[],
    verdict:{massResellLikelihood:null,dropshipLikelihood:null,deceptionRisk:'unknown',merchantRisk:'unknown',manipulationRisk:'unknown',fulfillmentRisk:'unknown',severeWarningAllowed:false,reason:'Not enough data.'},
    reviewIntegrity:reviews?{total:reviews.total,passed:reviews.total,flagged:0,passedPercent:100,flaggedPercent:0,lowStarCount:0,displayedRating:reviews.rating,adjustedRating:reviews.rating,commonComplaints:[],reviews:[]}:undefined,
  };
}

function stored(r:DropShredderReport):StoredObservation {
  return {id:r.product.capturedAt,identityKey:'url:shop.example/p',capturedAt:r.product.capturedAt,domain:'shop.example',url:r.product.url,title:r.product.title,price:r.product.price,report:r};
}

test('repeated countdown wording across days becomes a strong longitudinal warning',()=>{
  const current=report('2026-01-05T12:00:00Z','Sale ends in 00:14:52');
  const previous=[
    stored(report('2026-01-01T12:00:00Z','Sale ends in 00:09:12')),
    stored(report('2026-01-03T12:00:00Z','Sale ends in 00:22:41')),
  ];
  const finding=analyzeHistory(current,previous).find(x=>x.id==='REPEATED_SCARCITY_CLAIM');
  assert.equal(finding?.severity,'strong');
});

test('one repeated scarcity observation is not enough to accuse the store',()=>{
  const current=report('2026-01-05T12:00:00Z','Only 3 left');
  const previous=[stored(report('2026-01-04T12:00:00Z','Only 3 left'))];
  assert.equal(analyzeHistory(current,previous).some(x=>x.id==='REPEATED_SCARCITY_CLAIM'),false);
});


test('joint review count and rating jump is surfaced for investigation',()=>{
  const current=report('2026-02-01T00:00:00Z',undefined,30,{total:140,rating:4.8});
  const previous=[stored(report('2026-01-01T00:00:00Z',undefined,30,{total:50,rating:3.7}))];
  assert.equal(analyzeHistory(current,previous).some(x=>x.id==='REVIEW_HISTORY_JUMP'),true);
});

test('ordinary review growth without a large rating jump is not flagged',()=>{
  const current=report('2026-02-01T00:00:00Z',undefined,30,{total:140,rating:4.2});
  const previous=[stored(report('2026-01-01T00:00:00Z',undefined,30,{total:50,rating:4.0}))];
  assert.equal(analyzeHistory(current,previous).some(x=>x.id==='REVIEW_HISTORY_JUMP'),false);
});
