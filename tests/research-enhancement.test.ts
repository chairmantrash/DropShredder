import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGtin, compareProductIdentity, normalizeProductIdentifier } from '../src/analysis/product-identity';
import { buildExactProductFingerprint, compareExactProductFingerprints } from '../src/forensics/product-fingerprint';
import { calculateVerdict, dedupeEvidence } from '../src/analysis/evidence-engine';
import { fuseEvidence } from '../src/analysis/evidence-fusion';
import { runPassiveRules } from '../src/analysis/passive-rules';
import { extractCertificationClaims } from '../src/analysis/certification-claims';
import { focusedSafetyEvidence } from '../src/intelligence/focused-safety';
import { matchRegulatoryRecord, type RegulatoryRecord } from '../src/intelligence/regulatory-match';
import { analyzeMerchantOrigin, jurisdictionHits } from '../src/analysis/merchant-origin';
import { fulfillmentContradictions } from '../src/analysis/contradictions';
import { indexedSourceEvidence, findIndexedSourceMatches } from '../src/analysis/source-match';
import { imageHistoryEvidence, findImageHistoryMatches } from '../src/forensics/image-history';
import { localMerchantNetworkEvidence } from '../src/analysis/merchant-network';
import { productMutationEvidence } from '../src/analysis/product-mutation';
import { analyzeHistory } from '../src/analysis/history-signals';
import type { ProductSnapshot } from '../src/types/product';
import type { EvidenceSignal } from '../src/types/evidence';
import type { StoredObservation } from '../src/storage/history';

const product=(patch:Partial<ProductSnapshot>={}):ProductSnapshot=>({url:'https://shop.example/p',domain:'shop.example',
  capturedAt:'2026-10-08T00:00:00Z',imageUrls:[],jsonLdProductCount:1,claims:[],pageSignals:[],...patch});
const signal=(patch:Partial<EvidenceSignal>={}):EvidenceSignal=>({id:'one',family:'provenance',severity:'strong',confidence:1,weight:24,title:'x',explanation:'x',independentKey:'one',...patch});
const image={url:'https://img.example/p',sha256:'abc',ahash:'01'.repeat(32),dhash:'10'.repeat(32),width:800,height:800,capturedAt:'2026-10-07T00:00:00Z'};
function history(patch:Partial<ProductSnapshot>={}):StoredObservation {
  const p=product({url:'https://aliexpress.com/item/p?token=secret#x',domain:'aliexpress.com',capturedAt:'2026-10-07T00:00:00Z',...patch});
  return {id:'obs',identityKey:'test',domain:p.domain,url:p.url,capturedAt:p.capturedAt,
    report:{version:1,product:p,merchant:{domain:p.domain},evidence:[],contradictions:[],verdict:calculateVerdict([])}};
}

test('GTIN formatting/padding validates check digit without erasing packaging indicator',()=>{
  assert.equal(normalizeGtin('０ １２３４５-６７８９０ ５'),normalizeGtin('00012345678905'));
  assert.equal(normalizeGtin('012345678904'),undefined);
  assert.equal(normalizeGtin('000000000000'),undefined);
  assert.equal(normalizeGtin('X012345678905'),undefined);
  assert.notEqual(normalizeGtin('10012345678902'),normalizeGtin('012345678905'));
});
test('identifier normalization preserves distinct punctuation and non-Latin brands',()=>{
  assert.notEqual(normalizeProductIdentifier('AB/123'),normalizeProductIdentifier('AB123'));
  assert.equal(normalizeProductIdentifier('ＡＢ–１２３'),normalizeProductIdentifier('AB-123'));
  assert.equal(normalizeProductIdentifier('品牌'), '品牌');
});
test('store SKU/model namespace collisions do not establish product identity',()=>{
  assert.deepEqual(compareProductIdentity({sku:'X100'},{mpn:'X100'}).matches,[]);
  assert.deepEqual(compareProductIdentity({sku:'X100'},{sku:'X100'}).matches,[]);
  assert.deepEqual(compareProductIdentity({brand:'Acme',mpn:'X-100'},{brand:'ACME',mpn:'X100'}).matches,['brand-model']);
});
test('explicit GTIN and variant conflicts defeat identical stock photos',()=>{
  const a=buildExactProductFingerprint({gtin:'012345678905',imageHashes:['abc'],specs:{color:'red'}});
  const b=buildExactProductFingerprint({gtin:'4006381333931',imageHashes:['abc'],specs:{color:'blue'}});
  assert.equal(compareExactProductFingerprints(a,b).score,0);
  assert.equal(compareExactProductFingerprints(a,b).exactIdentity,false);
});
test('bad identical GTIN strings cannot create exact identity',()=>{
  assert.equal(compareExactProductFingerprints(buildExactProductFingerprint({gtin:'123'}),buildExactProductFingerprint({gtin:'123'})).exactIdentity,false);
});
test('indexed source rejects cross-type identifiers and contradictory variants',()=>{
  assert.equal(findIndexedSourceMatches(product({sku:'X100'}),[history({mpn:'X100'})]).length,0);
  assert.equal(findIndexedSourceMatches(product({imageFingerprints:[image],specifications:{color:'red'}}),[history({imageFingerprints:[image],specifications:{color:'blue'}})]).length,0);
});
test('source ranking selects evidence by strength and redacts URL queries',()=>{
  const current=product({gtin:'012345678905',technicalFingerprint:'fp',imageFingerprints:[image]});
  const weak=history({technicalFingerprint:'fp'}),strong=history({gtin:current.gtin,imageFingerprints:[image]});
  const a=indexedSourceEvidence(current,[weak,strong]),b=indexedSourceEvidence(current,[strong,weak]);
  assert.deepEqual(a,b);assert.equal(a[0]?.severity,'strong');
  assert.doesNotMatch(a[0]?.observedValue??'',/secret|token=|#x/);
  assert.match(a[0]?.explanation??'',/do not establish publication order/);
});
test('future or unknown local source timestamps remain unscored',()=>{
  for(const capturedAt of ['invalid','2027-01-01T00:00:00Z']){
    const evidence=indexedSourceEvidence(product({gtin:'012345678905'}),[history({gtin:'012345678905',capturedAt})]);
    assert.equal(evidence[0]?.weight,0);assert.equal(evidence[0]?.severity,'info');
  }
});
test('same image via source matching and image history counts once',()=>{
  const p=product({technicalFingerprint:'fp',imageFingerprints:[image]});
  const old=[history({technicalFingerprint:'fp',imageFingerprints:[image]})];
  assert.equal(dedupeEvidence([...indexedSourceEvidence(p,old),...imageHistoryEvidence(p,old)]).length,1);
});
test('image history retains the strongest relationship without gallery-pair inflation',()=>{
  const current=product({imageFingerprints:[image]});
  const old=history({imageFingerprints:[{...image,sha256:'different',url:'https://img.example/near'},image]});
  const matches=findImageHistoryMatches(current,[old]);
  assert.equal(matches.length,1);assert.equal(matches[0]?.exact,true);assert.equal(matches[0]?.historicalUrl,image.url);
});
test('image history places unresolved dates after valid observations',()=>{
  const current=product({imageFingerprints:[image]});
  const matches=findImageHistoryMatches(current,[history({imageFingerprints:[image],capturedAt:'unknown'}),history({imageFingerprints:[image]})]);
  assert.equal(matches.length,2);assert.equal(matches[0]?.historicalCapturedAt,'2026-10-07T00:00:00Z');
});
test('shared or transitive ancestry cannot unlock a severe verdict across families',()=>{
  const a=signal({correlationKeys:['parent-a']}),b=signal({id:'b',independentKey:'b',family:'fulfillment',correlationKeys:['parent-a','parent-b']}),c=signal({id:'c',independentKey:'c',family:'fulfillment',correlationKeys:['parent-b']});
  assert.equal(dedupeEvidence([a,b,c]).length,1);
  assert.equal(calculateVerdict([a,b,c]).severeWarningAllowed,false);
  assert.equal(calculateVerdict([a,signal({independentKey:'different',family:'fulfillment'})]).severeWarningAllowed,true);
});
test('malformed confidence/weight cannot poison scores or unlock accusations',()=>{
  for(const patch of [{confidence:NaN},{confidence:Infinity},{confidence:2},{weight:Infinity},{weight:NaN}]){
    const v=calculateVerdict([signal({...patch,severity:'direct'})]);
    assert.equal(v.severeWarningAllowed,false);assert.equal(v.massResellLikelihood,null);
  }
});
test('fusion dedupes across families and refuses trust from empty coverage',()=>{
  const one={id:'a',family:'provenance',strength:'strong' as const,score:.95,sourceKey:'a',independenceKey:'shared'};
  const r=fuseEvidence([one,{...one,id:'b',family:'claims',sourceKey:'b'}],['provenance','claims']);
  assert.equal(r.independentFamilies,1);assert.notEqual(r.verdict,'strong-red-flags');
  assert.equal(fuseEvidence([],['provenance','claims','reviews']).verdict,'not-enough-data');
  const sharedSource=fuseEvidence([one,{...one,id:'c',family:'claims',independenceKey:'other'}],['provenance','claims']);
  assert.equal(sharedSource.independentFamilies,1);
  assert.equal(sharedSource.evidenceScore,fuseEvidence([one],['provenance']).evidenceScore);
});
test('all marketplace contexts are informational and cannot establish dropshipping',()=>{
  for(const domain of ['etsy.com','ebay.com','tiktok.com','wayfair.com','depop.com','mercari.com']){
    const items=runPassiveRules(product({url:'https://www.'+domain+'/p',domain}), '');
    assert.ok(items.some(x=>x.id==='MARKETPLACE_POLICY_CONTEXT'));
    assert.equal(calculateVerdict(items).dropshipLikelihood,null);
    assert.equal(calculateVerdict(items).severeWarningAllowed,false);
  }
  assert.equal(runPassiveRules(product({url:'https://etsy.com.evil.example/p'}),'').length,0);
});
test('certificates preserve case and component scope without a verified-product claim',()=>{
  const p=product({title:'Cotton shirt',description:'Fabric OEKO-TEX STANDARD 100. Certificate number: AbC.123-X'});
  const claims=extractCertificationClaims(p);
  assert.equal(claims[0]?.rawIdentifier,'AbC.123-X');assert.equal(claims[0]?.subject,'component');
  assert.equal(claims[0]?.status,'claim-only');
  assert.equal(calculateVerdict(runPassiveRules(p,'')).dropshipLikelihood,null);
});
test('cosmetic registration certificate is distinguished from export certificates and non-cosmetics',()=>{
  const cosmetic=product({title:'Face serum',description:'FDA-issued cosmetic registration certificate'});
  assert.ok(extractCertificationClaims(cosmetic).some(x=>x.standard==='FDA cosmetic registration'));
  assert.equal(extractCertificationClaims(product({title:'Cosmetic serum',description:'FDA cosmetic export certificate'})).length,0);
  assert.equal(extractCertificationClaims(product({title:'Medical device',description:'FDA registration certificate'})).length,0);
});

const scoped:RegulatoryRecord={authority:'CPSC',recordId:'test',brand:'Acme',model:'X100',title:'Acme appliance',url:'https://example.test/notice',
  serialRanges:[{prefix:'A',start:'2001',end:'2310'}],requiredAttributes:{color:['red']}};
test('regulatory scope is unresolved without serial/variant and excludes unaffected units',()=>{
  assert.equal(matchRegulatoryRecord({brand:'Acme',model:'X100'},scoped)?.coverage,'unresolved');
  for(const serial of ['A2000','A2311','A20010','a2001']){
    const match=matchRegulatoryRecord({brand:'Acme',model:'X100',serial,attributes:{color:'red'}},scoped);
    assert.equal(match?.coverage,'excluded');assert.equal(match?.actionable,false);
  }
  for(const serial of ['A2001','A2310']) assert.equal(matchRegulatoryRecord({brand:'Acme',model:'X100',serial,attributes:{color:'red'}},scoped)?.actionable,true);
  assert.equal(matchRegulatoryRecord({brand:'Acme',model:'X100',serial:'A2001',attributes:{color:'blue'}},scoped)?.coverage,'excluded');
});
test('exact GTIN does not bypass known model or scope conflicts',()=>{
  const r={...scoped,gtins:['012345678905']};
  const match=matchRegulatoryRecord({gtin:'012345678905',brand:'Acme',model:'X200'},r);
  assert.equal(match?.actionable,false);assert.equal(match?.coverage,'excluded');
});
test('focused notices require exact product subject and preserve unknown unit coverage',()=>{
  const p=product({title:'Anker power bank A1681',brand:'Anker',mpn:'A1681'});
  const e=focusedSafetyEvidence(p);assert.equal(e.length,1);assert.equal(e[0]?.weight,0);
  assert.match(e[0]?.observedValue??'',/Official serial verification required/);
  assert.equal(focusedSafetyEvidence(product({title:'Case for Anker power bank A1681',brand:'Anker',mpn:'A1681'})).length,0);
  assert.equal(focusedSafetyEvidence(product({title:'Anker power bank A1681-B',brand:'Anker',mpn:'A1681-B'})).length,0);
  assert.equal(focusedSafetyEvidence(product({title:'Unanker power bank A1681',brand:undefined,mpn:'A1681'})).length,0);
  assert.equal(focusedSafetyEvidence(product({title:'Frigidaire minifridge EFMIS121',brand:'Frigidaire',mpn:'EFMIS121',specifications:{color:'blue'}})).length,0);
});
test('main-page origin claims and aliases stay separate from manufacture',()=>{
  const r=analyzeMerchantOrigin('We are based in USA. Made in Japan. Orders ship from Canada.',[]);
  assert.match(r.claims.businessLocation??'',/USA/);assert.match(r.claims.manufacture??'',/Japan/);assert.match(r.claims.fulfillment??'',/Canada/);
  assert.deepEqual(jurisdictionHits('Contact us about shipping.'),[]);
  assert.equal(fulfillmentContradictions([{kind:'ships-from',text:'Ships from USA',normalizedValue:'USA',confidence:.9}],{origin:'Chicago, United States',source:'user'}).length,0);
});
test('ordinary policy placement and incidental country mentions are not concealment or return friction',()=>{
  const r=analyzeMerchantOrigin('Product details.',[
    {kind:'about',url:'https://shop.example/about',text:'We are based in USA.'},
    {kind:'returns',url:'https://shop.example/returns',text:'We accept shoppers from China. Returns within 30 days.'},
  ]);
  assert.equal(r.evidence.find(x=>x.id==='MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES')?.weight,0);
  assert.equal(r.evidence.some(x=>x.id==='RETURN_JURISDICTION_DIFFERS'),false);
});

test('a shared product identifier is informational merchant context, not ownership',()=>{
  const evidence=localMerchantNetworkEvidence(product({gtin:'012345678905'}),[history({gtin:'012345678905'})]);
  assert.equal(evidence[0]?.weight,0);assert.equal(evidence[0]?.severity,'info');
  assert.equal(calculateVerdict(evidence).merchantRisk,'unknown');
});
test('selected variants on the same page do not become listing mutation',()=>{
  const current=product({gtin:'012345678905',specifications:{color:'red'},technicalFingerprint:'new',imageFingerprints:[image]});
  const old=history({url:current.url,domain:current.domain,gtin:'4006381333931',specifications:{color:'blue'},technicalFingerprint:'old',imageFingerprints:[{...image,sha256:'other'}]});
  assert.equal(productMutationEvidence(current,[old]).length,0);
});
test('historical price warnings require same offer, currency, chronology and compatible variant',()=>{
  const current=history({url:'https://shop.example/p',domain:'shop.example',capturedAt:'2026-10-08T00:00:00Z',price:100,currency:'USD',specifications:{color:'red'}}).report;
  const old=(patch:Partial<ProductSnapshot>={})=>history({url:current.product.url,domain:current.product.domain,price:20,currency:'USD',specifications:{color:'red'},...patch});
  assert.ok(analyzeHistory(current,[old(),old({capturedAt:'2026-10-06T00:00:00Z'})]).some(x=>x.id==='LARGE_PRICE_SWING_HISTORY'));
  for(const patch of [{currency:'EUR'},{currency:undefined},{specifications:{color:'blue'}},{domain:'other.example'},{capturedAt:'2027-01-01'}]){
    assert.equal(analyzeHistory(current,[old(patch),old({...patch,capturedAt:patch.capturedAt??'2026-10-06T00:00:00Z'})]).some(x=>x.id==='LARGE_PRICE_SWING_HISTORY'),false);
  }
});
test('flat perceptual hashes and future image timestamps cannot supply weighted chronology',()=>{
  const p=product({imageFingerprints:[{...image,ahash:'0'.repeat(64),dhash:'1'.repeat(64)}]});
  const flat=history({imageFingerprints:[{...image,sha256:'different',ahash:'0'.repeat(64),dhash:'1'.repeat(64)}]});
  assert.equal(imageHistoryEvidence(p,[flat]).length,0);
  const future=history({capturedAt:'2027-01-01',imageFingerprints:[image]});
  assert.equal(imageHistoryEvidence(p,[future])[0]?.weight,0);
});
