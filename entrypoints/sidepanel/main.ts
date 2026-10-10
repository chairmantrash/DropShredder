import {hasSensitiveCommerceSurface} from '../../src/security/sensitive-surface';
import {COMMERCE_LANGUAGE_KIT} from '../../src/languages/commerce-kit';
import { tr, localizeDocument, errorText, uiDirection } from '../../src/i18n/index';
import { showSearchChooser } from '../../src/ui/search-chooser';
import './style.css';
import { calculateVerdict } from '../../src/analysis/evidence-engine';
import { runPassiveRules } from '../../src/analysis/passive-rules';
import type { DropShredderReport } from '../../src/types/report';
import type { ProductSnapshot } from '../../src/types/product';
import { clearObservationHistory, getObservations, getRecentObservationsAll, productIdentityKey, saveObservation } from '../../src/storage/history';
import { analyzeHistory } from '../../src/analysis/history-signals';
import { analyzeReviewProvenance } from '../../src/analysis/review-provenance';
import { reviewIntegrity } from '../../src/analysis/review-integrity';
import type { ReviewSnapshot } from '../../src/types/review';
import { extractClaims } from '../../src/analysis/claims';
import { buildProductFingerprint } from '../../src/forensics/product-fingerprint';
import { analyzeEtsyPage, isEtsyDomain } from '../../src/adapters/etsy';
import { imageSearchUrls, merchantSearchUrls, productSearchUrls } from '../../src/deep-hunt/search-urls';
import { captureImageFingerprint } from '../../src/forensics/image-acquisition';
import { imageHistoryEvidence } from '../../src/forensics/image-history';
import { lookupDomainRdap } from '../../src/osint/rdap';
import { businessAgeContradictions, contradictionEvidence } from '../../src/analysis/contradictions';
import { loadFeatureSettings, updateFeatureSettings } from '../../src/settings/features';
import { indexedSourceEvidence } from '../../src/analysis/source-match';
import { reputationSearchUrls } from '../../src/reputation/reputation-search';
import { analyzeReturnPolicy } from '../../src/analysis/return-policy';
import { productMutationEvidence } from '../../src/analysis/product-mutation';
import { parseFulfillmentObservation } from '../../src/analysis/fulfillment-observation';
import { fulfillmentContradictions } from '../../src/analysis/contradictions';
import { analyzeMerchantOrigin, type SiteTextPage } from '../../src/analysis/merchant-origin';
import { catalogEvidence, type CatalogSnapshot } from '../../src/analysis/catalog-signals';
import { analyzeReputationObservations } from '../../src/reputation/complaint-analysis';
import { qualityClaimEvidence } from '../../src/analysis/quality-claims';
import { reviewDiscrepancyEvidence, type HostedReviewSummary } from '../../src/reputation/review-discrepancy';
import { detectCommercePlatforms } from '../../src/intelligence/commerce-platforms';
import { buildSupplyChainProfile, detectPaymentProcessors } from '../../src/analysis/supply-chain-profile';
import { merchantNetworkEvidence, merchantNetworkForDomain } from '../../src/intelligence/merchant-networks';
import { crossDomainReferenceEvidence, localMerchantNetworkEvidence } from '../../src/analysis/merchant-network';
import { amazonCloneClusterEvidence, type AmazonSearchCard } from '../../src/analysis/amazon-clone-clusters';
import { pageSafety } from '../../src/security/page-safety';
import { toneCopy, type ToneMode } from '../../src/ui/tone';
import { renderShopperReport } from '../../src/ui/report-renderer';
import { extractPageScan, type PageScanResult } from '../../src/extraction/page-scan';
import { activeWebTab, authorizeChromePage, documentTarget, isCurrentChromePage, type AuthorizedChromePage } from '../../src/runtime/chrome-page';
import { AUTO_PANEL_INTENT, AUTO_PATTERN, setAutoContentRegistration } from '../../src/runtime/auto-registration';
import { loadUserLists } from '../../src/intelligence/user-lists';
import { approximateImportedProductLeads, importedEntityRoleGraph, importedProductLeads } from '../../src/analysis/product-leads';
import { setReportGuard } from '../../src/ui/report-guard';

localizeDocument();
const scanButton=document.querySelector<HTMLButtonElement>('#scan');
const status=document.querySelector<HTMLElement>('#status');
const summary=document.querySelector<HTMLElement>('#summary');
const evidenceList=document.querySelector<HTMLElement>('#evidence');
const raw=document.querySelector<HTMLElement>('#raw');
const huntActions=document.querySelector<HTMLElement>('#hunt-actions');
const huntSources=document.querySelector<HTMLButtonElement>('#hunt-sources');
const huntImage=document.querySelector<HTMLButtonElement>('#hunt-image');
const huntStore=document.querySelector<HTMLButtonElement>('#hunt-store');
const checkDomain=document.querySelector<HTMLButtonElement>('#check-domain');
const autoSourceHunt=document.querySelector<HTMLInputElement>('#auto-source-hunt');
const autoProtection=document.querySelector<HTMLInputElement>('#auto-protection');
const autoProtectionStatus=document.querySelector<HTMLElement>('#auto-protection-status');
const preferMadeInUSA=document.querySelector<HTMLInputElement>('#prefer-made-in-usa');
const reputationSweep=document.querySelector<HTMLButtonElement>('#reputation-sweep');
const policyCheck=document.querySelector<HTMLButtonElement>('#policy-check');
const fulfillmentCheck=document.querySelector<HTMLButtonElement>('#fulfillment-check');
const clearHistory=document.querySelector<HTMLButtonElement>('#clear-history');
const revokeOptionalAccess=document.querySelector<HTMLButtonElement>('#revoke-optional-access');
const buildMeta=document.querySelector<HTMLElement>('#build-meta');
const toneMode=document.querySelector<HTMLSelectElement>('#tone-mode');
const evidenceHeading=document.querySelector<HTMLElement>('#evidence-heading');
let lastReport:DropShredderReport|undefined;
let reportPage:AuthorizedChromePage|undefined;
let scanningTabId:number|undefined;
let scanEpoch=0;
let domainRequest:AbortController|undefined;
const cancelDomain=document.querySelector<HTMLButtonElement>('#cancel-domain');
function stopDomainLookup():void{domainRequest?.abort();domainRequest=undefined;if(checkDomain) checkDomain.disabled=false;if(cancelDomain) cancelDomain.disabled=true;}
cancelDomain?.addEventListener('click',()=>{stopDomainLookup();if(status) status.textContent=tr('Domain lookup canceled.');});

// The side panel outlives tabs and documents. Never reuse a report after navigation.
function invalidatePageReport(message=tr('The page changed. Check this product again.')):void {
  stopDomainLookup();
  document.querySelector('#ds-search-chooser')?.remove();
  scanEpoch++;
  lastReport=undefined;
  reportPage=undefined;
  scanningTabId=undefined;
  if(scanButton) scanButton.disabled=false;
  if(huntActions) huntActions.hidden=true;
  if(summary) summary.replaceChildren();
  if(evidenceList) evidenceList.replaceChildren();
  if(raw) raw.replaceChildren();
  if(status) status.textContent=message;
}
chrome.tabs.onActivated.addListener(({tabId})=>{
  if((scanningTabId!==undefined && scanningTabId!==tabId) || (reportPage && reportPage.tabId!==tabId)){
    invalidatePageReport();
  }
});
chrome.tabs.onUpdated.addListener((tabId,change)=>{
  if((tabId===scanningTabId || tabId===reportPage?.tabId) &&
    (change.status==='loading' || (Boolean(change.url) && change.url!==reportPage?.url))){
    invalidatePageReport();
  }
});
chrome.permissions.onRemoved.addListener(permission=>{
  if(permission.origins?.length && (scanningTabId!==undefined || reportPage)) invalidatePageReport(tr('Site access changed. Check this product again.'));
});

async function verifiedReportPage(report:DropShredderReport):Promise<AuthorizedChromePage>{
  const page=reportPage;
  if(!page || lastReport!==report || !(await isCurrentChromePage(page)) || lastReport!==report){
    invalidatePageReport();
    throw new Error('The page changed. Check this product again.');
  }
  return page;
}
setReportGuard(async()=>{const report=lastReport;if(!report) return false;await verifiedReportPage(report);return lastReport===report;});

let currentTone:ToneMode='professional';
function applyTone(mode:ToneMode):void{
  currentTone=mode;
  const copy=toneCopy(mode);
  if(scanButton) scanButton.textContent=copy.scan;
  if(evidenceHeading) evidenceHeading.textContent=copy.evidenceHeading;
}
if(buildMeta) buildMeta.textContent=tr('DropShredder $1 • Private by design • No account needed',chrome.runtime.getManifest().version);
void loadFeatureSettings().then(settings=>{
  if(autoSourceHunt) autoSourceHunt.checked=settings.autoSourceHunt;
  if(autoProtection){
    autoProtection.checked=settings.autoProtection;
    if(settings.autoProtection){
      void chrome.permissions.contains({origins:[AUTO_PATTERN]}).then(granted=>{
        if(!granted && autoProtection){
          autoProtection.checked=false;
          if(autoProtectionStatus) autoProtectionStatus.textContent=tr('Automatic alerts need Chrome site permission. Switch on to allow it.');
        }
      });
    }
  }
  if(preferMadeInUSA) preferMadeInUSA.checked=settings.preferMadeInUSA;
  if(toneMode) toneMode.value=settings.toneMode;
  applyTone(settings.toneMode);
});

autoProtection?.addEventListener('change',()=>{
  if(!autoProtection) return;
  const wanted=autoProtection.checked;
  autoProtection.disabled=true;
  if(autoProtectionStatus) autoProtectionStatus.textContent=wanted
    ? tr('Asking Chrome to allow automatic product alerts…')
    : tr('Turning off automatic alerts…');
  // Permission request MUST be invoked directly in the click/change gesture.
  const grant=wanted?chrome.permissions.request({origins:[AUTO_PATTERN]}):Promise.resolve(false);
  void grant.then(async allowed=>{
    if(wanted && !allowed){
      if(autoProtection) autoProtection.checked=false;
      if(autoProtectionStatus) autoProtectionStatus.textContent=tr('Chrome permission was not granted. Manual checks still work.');
      return;
    }
    // Turn the saved gate off before unregistering so already-injected tabs
    // reject alerts even when Chrome's registration cleanup races a worker.
    if(wanted) await setAutoContentRegistration(true);
    await updateFeatureSettings({autoProtection:wanted});
    if(!wanted) await setAutoContentRegistration(false);
    if(wanted){
      // Newly enabled protection should check the currently visible product page too.
      const tab=await activeWebTab();
      if(tab?.id){
        void chrome.scripting.executeScript({
          target:{tabId:tab.id},
          world:'ISOLATED',
          files:['content-scripts/auto.js'],
        }).catch(()=>{});
      }
    }
    if(!wanted) await chrome.permissions.remove({origins:[AUTO_PATTERN]});
    if(autoProtectionStatus) autoProtectionStatus.textContent=wanted
      ? tr('Automatic alerts are on for supported shopping pages. Other pages stay quiet.')
      : tr('Automatic alerts are off. Extra broad site access removed.');
  }).catch(error=>{
    if(autoProtectionStatus) autoProtectionStatus.textContent=error instanceof Error?errorText(error):tr('Could not update automatic alerts.');
    if(autoProtection) autoProtection.checked=!wanted;
  }).finally(()=>{if(autoProtection) autoProtection.disabled=false;});
});

autoSourceHunt?.addEventListener('change',()=>{
  const wanted=autoSourceHunt.checked;
  void updateFeatureSettings({autoSourceHunt:wanted}).catch(()=>{autoSourceHunt.checked=!wanted;if(status) status.textContent=tr('Could not save source-hunt setting.');});
});

preferMadeInUSA?.addEventListener('change',()=>{
  const wanted=preferMadeInUSA.checked;
  void updateFeatureSettings({preferMadeInUSA:wanted}).catch(()=>{preferMadeInUSA.checked=!wanted;if(status) status.textContent=tr('Could not save origin preference.');});
});

toneMode?.addEventListener('change',()=>{
  const next=(toneMode.value==='aggressive'||toneMode.value==='nuclear')?toneMode.value:'professional';
  applyTone(next);
  void updateFeatureSettings({toneMode:next}).catch(()=>{if(status) status.textContent=tr('Could not save tone preference.');});
  if(lastReport) renderReport(lastReport);
});

function renderReport(report: DropShredderReport): void {
  if(!summary || !evidenceList || !raw) return;
  lastReport=report;
  if(huntActions) huntActions.hidden=false;
  renderShopperReport(report,{summary,evidenceList,raw},currentTone);
}

async function scanActivePage(): Promise<void> {
  if (!scanButton || !status) return;
  const epoch=++scanEpoch;
  scanButton.disabled=true;
  lastReport=undefined;
  reportPage=undefined;
  if(huntActions) huntActions.hidden=true;
  if(summary) summary.replaceChildren();
  if(evidenceList) evidenceList.replaceChildren();
  if(raw) raw.replaceChildren();
  status.textContent=tr('Checking the listing for things worth a second look…');

  try {
    const tab=await activeWebTab();
    if (!tab?.id) throw new Error('Open the product page you want to check, then try again.');
    if(epoch!==scanEpoch) return;
    scanningTabId=tab.id;
    const page=await authorizeChromePage(tab);
    if(!page) throw new Error('Chrome needs permission for this site. Click Allow for DropShredder in Chrome’s extension controls, then click CHECK THIS PRODUCT again.');
    const safety=pageSafety(page.url);
    if(!safety.allowed) throw new Error(safety.reason ?? 'DropShredder won’t scan this kind of page.');

    const [sensitiveSurface]=await chrome.scripting.executeScript({
      target:documentTarget(page),
      func:hasSensitiveCommerceSurface,
      args:[COMMERCE_LANGUAGE_KIT.privateFormParts],
    });
    if(sensitiveSurface?.result){
      throw new Error('This looks like a sign-in or payment page, so DropShredder is staying out of it.');
    }

    const [execution]=await chrome.scripting.executeScript({
      target:documentTarget(page),
      world:'ISOLATED',
      func:extractPageScan,
      args:[COMMERCE_LANGUAGE_KIT],
    });

    const result=execution?.result as PageScanResult|undefined;
    if (!result) throw new Error('The page did not return a scan result.');
    if(result.product.url!==page.url) throw new Error('The page changed while DropShredder was checking it. Try the scan again on the finished product page.');
    if(epoch!==scanEpoch || !(await isCurrentChromePage(page))) throw new Error('The page changed while DropShredder was checking it. Try again.');

    const platformMatches=detectCommercePlatforms({
      scripts:result.scriptSources,
      html:result.htmlSignature,
      imageUrls:result.product.imageUrls,
    });
    const platformSignals=platformMatches.map(platform=>`platform:${platform.id}`);
    result.product={
      ...result.product,
      pageSignals:[...new Set([...(result.product.pageSignals ?? []),...platformSignals])],
    };
    const paymentProcessors=detectPaymentProcessors({scripts:result.scriptSources,html:result.htmlSignature});

    const extractedClaims=extractClaims(result.pageText);
    const fingerprint=buildProductFingerprint({
      title:result.product.title,
      description:result.product.description,
      brand:result.product.brand,
      sku:result.product.sku,
      mpn:result.product.mpn,
      gtin:result.product.gtin,
      asin:result.product.asin,
      specifications:result.product.specifications,
    });
    result.product={
      ...result.product,
      claims:[...new Set([...(result.product.claims ?? []),...extractedClaims.map(claim=>claim.text)])],
      technicalFingerprint:fingerprint.canonical || undefined,
    };

    const evidence=runPassiveRules(result.product,result.pageText);
    try{const lists=(await loadUserLists()).lists;evidence.push(...importedProductLeads(result.product,lists),...approximateImportedProductLeads(result.product,lists),...importedEntityRoleGraph(result.product,lists));}catch{/* Optional local references do not block a scan. */}
    evidence.push(...amazonCloneClusterEvidence(result.amazonSearchCards));
    evidence.push(...merchantNetworkEvidence(result.product.domain));
    evidence.push(...catalogEvidence(result.catalog));
    for(const platform of platformMatches){
      evidence.push({
        id:'COMMERCE_PLATFORM_CONTEXT',
        family:'technology',
        severity:'info',
        confidence:.9,
        weight:0,
        title:`${platform.name} commerce stack detected`,
        explanation:platform.dropshipContext,
        observedValue:platform.name,
        independentKey:`platform-context:${platform.id}`,
      });
    }

    let sitePages:SiteTextPage[]=[];
    try{
      if(result.siteLinks.length){
        const [siteExecution]=await chrome.scripting.executeScript({
          target:documentTarget(page),
          world:'ISOLATED',
          args:[result.siteLinks],
          func:async(links:Array<{kind:'about'|'shipping'|'returns'|'contact';url:string}>)=>{
            const fetchPage=async(link:{kind:'about'|'shipping'|'returns'|'contact';url:string})=>{
              try{
                const response=await fetch(link.url,{
                  credentials:'omit',
                  cache:'force-cache',
                  signal:AbortSignal.timeout(3500),
                });
                if(!response.ok) return undefined;
                const length=Number(response.headers.get('content-length') || 0);
                if(length>2_000_000) return undefined;
                if(new URL(response.url).origin!==location.origin || !response.body) return undefined;
                const reader=response.body.getReader();
                const decoder=new TextDecoder();
                let html='',size=0;
                try{
                  while(true){
                    const {done,value}=await reader.read();
                    if(done) break;
                    size+=value.byteLength;
                    if(size>2_000_000) return undefined;
                    html+=decoder.decode(value,{stream:true});
                  }
                  html+=decoder.decode();
                }finally{
                  void reader.cancel().catch(()=>{});
                }
                const doc=new DOMParser().parseFromString(html,'text/html');
                const text=(doc.body?.innerText || '').replace(/\s+/g,' ').slice(0,80000);
                return text ? {...link,text} : undefined;
              }catch{
                return undefined;
              }
            };
            const results=await Promise.all(links.slice(0,4).map(fetchPage));
            return results.filter((page):page is {kind:'about'|'shipping'|'returns'|'contact';url:string;text:string}=>Boolean(page));
          },
        });
        sitePages=(siteExecution?.result ?? []) as SiteTextPage[];
        const origin=analyzeMerchantOrigin(result.pageText,sitePages);
        evidence.push(...origin.evidence);
        const network=merchantNetworkForDomain(result.product.domain);
        if(network){
          const networkText=[result.pageText,...sitePages.map(page=>page.text)].join(' ');
          evidence.push(...crossDomainReferenceEvidence(result.product.domain,networkText,network.domains));
        }
        const returns=sitePages.find(page=>page.kind==='returns');
        if(returns) evidence.push(...analyzeReturnPolicy(returns.text));
      }
    }catch(siteIntelError){
      console.warn('DropShredder: bounded same-site intelligence scan failed',siteIntelError);
    }
    if(fingerprint.identifiers.length){
      evidence.push({
        id:'PRODUCT_IDENTIFIERS_PRESENT',family:'provenance',severity:'info',confidence:.95,weight:0,
        title:'Product ID found',
        explanation:'This ID can help us match the exact product on other listings. Finding one is not a warning by itself.',
        observedValue:fingerprint.identifiers.slice(0,6).join(', '),
        independentKey:'product-identifiers',
      });
    }
    if(result.reviews.length>=5){
      evidence.push(...analyzeReviewProvenance({
        reviews:result.reviews,
        productTitle:result.product.title,
      }));
    }
    if (isEtsyDomain(result.product.domain)) {
      const etsy=analyzeEtsyPage(result.pageText);
      result.product={...result.product,...etsy.productPatch,claims:[...new Set([...(result.product.claims ?? []),...etsy.claims])]};
      evidence.push(...etsy.evidence);
    }
    const supplyChain=buildSupplyChainProfile({
      mainPageText:result.pageText,
      pages:sitePages,
      paymentProcessors,
    });

    evidence.push({
      id:'SUPPLY_CHAIN_PROFILE',
      family:'identity',
      severity:'info',
      confidence:.9,
      weight:0,
      title:supplyChain.label,
      explanation:supplyChain.preferenceNote,
      observedValue:[
        ...supplyChain.nodes
          .filter(node=>node.country||node.role==='payment')
          .map(node=>`${node.role}: ${node.country ?? node.detail ?? 'unknown'}`),
        supplyChain.paymentChainLabel,
      ].join(' • '),
      independentKey:'supply-chain-profile',
    });

    const currentSettings=await loadFeatureSettings();
    if(currentSettings.preferMadeInUSA && (
      supplyChain.classification==='predominantly-international' ||
      supplyChain.classification==='known-chain-entirely-international' ||
      supplyChain.classification==='mixed-us-international'
    )){
      evidence.push({
        id:'MADE_IN_USA_PREFERENCE_MISMATCH',
        family:'identity',
        severity:'info',
        confidence:.95,
        weight:0,
        title:'Does not appear to match your Made in USA preference',
        explanation:'Parts of the product, seller, shipping or return path appear to involve other countries. That is a preference note, not a warning by itself.',
        observedValue:supplyChain.label,
        independentKey:'made-in-usa-preference',
      });
    }

    let report: DropShredderReport={
      version:1,
      product:result.product,
      merchant:{
        domain:result.product.domain,
        sellerName:result.product.seller,
        detectedPlatform:result.product.pageSignals.find(signal=>signal.startsWith('platform:'))?.split(':')[1],
      },
      evidence,
      contradictions:[],
      verdict:calculateVerdict(evidence),
      supplyChain,
      reviewIntegrity:result.reviews.length ? reviewIntegrity(result.reviews,result.product.title) : undefined,
    };

    try {
      const key=productIdentityKey(report);
      const previous=await getObservations(key,30);
      const historyEvidence=analyzeHistory(report,previous);
      if(historyEvidence.length){
        const combined=[...report.evidence,...historyEvidence];
        report={...report,evidence:combined,verdict:calculateVerdict(combined)};
      }

      const allHistory=await getRecentObservationsAll(250);
      const merchantLinkEvidence=localMerchantNetworkEvidence(report.product,allHistory);
      if(merchantLinkEvidence.length){
        const combined=[
          ...report.evidence.filter(existing=>!merchantLinkEvidence.some(item=>item.independentKey===existing.independentKey)),
          ...merchantLinkEvidence,
        ];
        report={...report,evidence:combined,verdict:calculateVerdict(combined)};
      }

      const mutationEvidence=productMutationEvidence(report.product,allHistory);
      if(mutationEvidence.length){
        const combined=[
          ...report.evidence.filter(existing=>!mutationEvidence.some(item=>item.independentKey===existing.independentKey)),
          ...mutationEvidence,
        ];
        report={...report,evidence:combined,verdict:calculateVerdict(combined)};
      }

      const settings=currentSettings;
      if(settings.autoSourceHunt){
        const sourceEvidence=indexedSourceEvidence(report.product,allHistory);
        if(sourceEvidence.length){
          const combined=[
            ...report.evidence.filter(existing=>!sourceEvidence.some(item=>item.independentKey===existing.independentKey)),
            ...sourceEvidence,
          ];
          report={...report,evidence:combined,verdict:calculateVerdict(combined)};
        }
      }

    } catch (historyError) {
      console.warn('DropShredder: local history/source-index read failed', historyError);
    }

    if(epoch!==scanEpoch || !(await isCurrentChromePage(page))) throw new Error('The page changed while DropShredder was checking it. Try again.');
    reportPage=page;
    renderReport(report);

    try {
      if(epoch===scanEpoch && await isCurrentChromePage(page)) await saveObservation(report);
    } catch (storageError) {
      console.warn('DropShredder: local history write failed', storageError);
    }

    await chrome.scripting.executeScript({
      target:documentTarget(page),
      args:[report.verdict.massResellLikelihood,report.evidence.length,report.verdict.severeWarningAllowed,{...toneCopy(currentTone),noVerdict:tr('DROPSHREDDER • NO VERDICT'),dismiss:tr('Dismiss DropShredder warning'),direction:uiDirection(),detail:tr('Mass-resell evidence score: $1/100 • Signals: $2 • $3',report.verdict.massResellLikelihood??tr('UNKNOWN'),report.evidence.length,report.verdict.severeWarningAllowed?tr('Independent evidence gate satisfied.'):tr('Evidence gate not satisfied; this is not a severe accusation.'))},page.url],
      func:(score:number|null,count:number,severe:boolean,copy:{signalsFound:string;severeWarning:string;noVerdict:string;dismiss:string;direction:string;detail:string},expectedUrl:string)=>{
        if(location.href!==expectedUrl) return false;
        document.getElementById('dropshredder-stamp-host')?.remove();
        const host=document.createElement('div');
        host.id='dropshredder-stamp-host';
        host.style.cssText='all:initial;position:fixed;right:16px;top:96px;z-index:2147483647;';
        const shadow=host.attachShadow({mode:'open'});
        const headline=severe
          ? `⚠ ${copy.severeWarning}`
          : count>0 ? `⚠ ${copy.signalsFound}` : copy.noVerdict;
        const style=document.createElement('style');
        style.textContent=`
          .box{width:310px;background:#0d0d0f;color:#fafafa;border:2px solid #ff453a;border-radius:10px;
            box-shadow:0 14px 44px rgba(0,0,0,.48);font-family:system-ui,sans-serif;padding:14px}
          .brand{font-size:11px;font-weight:900;letter-spacing:.16em;color:#ff453a;margin-bottom:8px}
          .headline{font-size:15px;font-weight:950;line-height:1.15}
          .detail{font-size:12px;line-height:1.4;color:#b9b9c0;margin-top:8px}
        `;
        const box=document.createElement('div');
        box.className='box';box.dir=copy.direction;
        const brand=document.createElement('div');
        brand.className='brand';
        brand.textContent='DROP SHREDDER';
        const headlineEl=document.createElement('div');
        headlineEl.className='headline';
        headlineEl.textContent=headline;
        const close=document.createElement('button');
        close.type='button';
        close.setAttribute('aria-label',copy.dismiss);
        close.textContent='×';
        close.style.cssText='all:initial;position:absolute;right:8px;top:5px;color:#b9b9c0;font:700 18px system-ui;cursor:pointer;padding:4px';
        close.addEventListener('click',()=>host.remove());

        const detail=document.createElement('div');
        detail.className='detail';
        detail.textContent=copy.detail;
        box.style.position='relative';
        box.append(close,brand,headlineEl,detail);
        shadow.append(style,box);
        document.documentElement.append(host);
        return true;
      },
    });
    if(epoch!==scanEpoch || !(await isCurrentChromePage(page))) throw new Error('The page changed while DropShredder was checking it. Try again.');
    scanningTabId=undefined;
    status.textContent=tr('Scan complete for $1.',result.product.domain);
  } catch (error) {
    if(epoch===scanEpoch){
      lastReport=undefined;
      reportPage=undefined;
      scanningTabId=undefined;
      if(huntActions) huntActions.hidden=true;
      status.textContent=errorText(error);
    }
  } finally {
    if(epoch===scanEpoch) scanButton.disabled=false;
  }
}

scanButton?.addEventListener('click',()=>void scanActivePage());

// A toast click opens Chrome's panel via a user gesture. The short-lived intent
// is in session storage across worker restarts, not in service-worker globals.
let consumingAutoPanelIntent=false;
async function consumeAutoPanelIntent():Promise<boolean>{
  if(consumingAutoPanelIntent) return true;
  consumingAutoPanelIntent=true;
  try{
  const value=(await chrome.storage.session.get(AUTO_PANEL_INTENT))[AUTO_PANEL_INTENT] as
    {tabId?:number;documentId?:string;createdAt?:number}|undefined;
  if(!value || !value.tabId || !value.documentId || !value.createdAt ||
    Date.now()-value.createdAt>15_000) return false;
  const tab=await activeWebTab();
  if(tab?.id!==value.tabId) return false;
  await chrome.storage.session.remove(AUTO_PANEL_INTENT);
  try{
    const [probe]=await chrome.scripting.executeScript({
      target:{tabId:value.tabId,documentIds:[value.documentId]},
      world:'ISOLATED',func:()=>location.href,
    });
    if(probe?.documentId!==value.documentId) return true;
    await scanActivePage();
  }catch{
    if(status) status.textContent=tr('The product page changed. Click CHECK THIS PRODUCT to try again.');
  }
  return true;
  }finally{
    consumingAutoPanelIntent=false;
  }
}

// Already-open panels do not reload when Chrome calls sidePanel.open again.
chrome.runtime.onMessage.addListener((message:unknown)=>{
  if(!message || typeof message!=='object') return;
  const received=message as Record<string,unknown>;
  if(received.type==='DS_AUTO_PANEL_READY' && received.version===1){
    void consumeAutoPanelIntent().catch(()=>{});
  }
});
// A newly opened panel might load after the worker's notification; session
// storage is the authoritative fallback, with one short bounded retry.
void (async()=>{
  try{
    if(!(await consumeAutoPanelIntent())){
      await new Promise(resolve=>setTimeout(resolve,250));
      await consumeAutoPanelIntent();
    }
  }catch{}
})();

async function openSearches(urls:Record<string,string>,maxTabs=8):Promise<void>{
  showSearchChooser(urls);
}

huntSources?.addEventListener('click',()=>void (async()=>{
  const report=lastReport;
  if(!report) return;
  try{
    await verifiedReportPage(report);
    if(report.product.title) await openSearches(productSearchUrls(report.product.title));
  }catch(error){if(status) status.textContent=errorText(error);}
})());
huntImage?.addEventListener('click',async()=>{
  const report=lastReport;
  const pageAtClick=reportPage;
  const image=report?.product.imageUrls[0];
  if(!image){
    await openSearches(imageSearchUrls());
    return;
  }

  if(status) status.textContent=tr('Checking whether this product image shows up elsewhere…');
  try {
      const fingerprint=await captureImageFingerprint(image);
      if(fingerprint && report){
        await verifiedReportPage(report);
        const existing=report.product.imageFingerprints ?? [];
        const nextEvidence={
          id:'LOCAL_IMAGE_FINGERPRINT',
          family:'provenance' as const,
          severity:'info' as const,
          confidence:1,
          weight:0,
          title:'Local image fingerprint captured',
          explanation:'DropShredder computed exact and perceptual hashes locally. A hash is not negative evidence by itself; it enables later duplicate/source chronology checks.',
          observedValue:`SHA-256 ${fingerprint.sha256.slice(0,16)}… • ${fingerprint.width}×${fingerprint.height}`,
          independentKey:`image-fingerprint:${fingerprint.sha256}`,
        };
        const nextProduct={
          ...report.product,
          imageFingerprints:[...existing.filter(item=>item.url!==image),fingerprint],
        };
        let nextEvidenceList=[...report.evidence.filter(e=>e.independentKey!==nextEvidence.independentKey),nextEvidence];

        try{
          const allHistory=await getRecentObservationsAll(250);
          const imageEvidence=imageHistoryEvidence(nextProduct,allHistory);
          for(const item of imageEvidence){
            nextEvidenceList=[
              ...nextEvidenceList.filter(existingItem=>existingItem.independentKey!==item.independentKey),
              item,
            ];
          }
        }catch(historyError){
          console.warn('DropShredder: cross-domain image history comparison failed',historyError);
        }

        await verifiedReportPage(report);
        lastReport={
          ...report,
          product:nextProduct,
          evidence:nextEvidenceList,
          verdict:calculateVerdict(nextEvidenceList),
        };
        renderReport(lastReport);
        try { await saveObservation(lastReport); } catch {}
      }
  } catch(error){
    console.warn('DropShredder: image fingerprinting failed',error);
  } finally {
    // The user explicitly requested a public reverse-image search, even if local hashing failed.
    if(pageAtClick && reportPage===pageAtClick){
      if(status) status.textContent=tr('Image search opened. See who else is using this picture.');
      await openSearches(imageSearchUrls(image));
    }
  }
});
huntStore?.addEventListener('click',()=>void (async()=>{
  const report=lastReport;
  if(!report) return;
  try{
    await verifiedReportPage(report);
    await openSearches(merchantSearchUrls(report.product.domain));
  }catch(error){if(status) status.textContent=errorText(error);}
})());


checkDomain?.addEventListener('click',async()=>{
  const report=lastReport;
  if(!report || !status || domainRequest) return;
  const active=new AbortController();domainRequest=active;checkDomain.disabled=true;if(cancelDomain) cancelDomain.disabled=false;
  status.textContent=tr('Checking how long this website has been around…');
  try{
      const rdap=await lookupDomainRdap(report.product.domain,active.signal);
      if(domainRequest!==active) return;
      await verifiedReportPage(report);
      if(!rdap){
        status.textContent=tr('Couldn’t confirm this website’s age right now.');
        return;
      }

      const claims=extractClaims(report.product.claims.join(' '));
      const contradictions=businessAgeContradictions(claims,{
        registeredAt:rdap.registeredAt,
        source:'RDAP',
      });
      const added=contradictionEvidence(contradictions);
      const rdapInfo={
        id:'RDAP_DOMAIN_OBSERVATION',
        family:'identity' as const,
        severity:'info' as const,
        confidence:.98,
        weight:0,
        title:'Domain registration chronology retrieved',
        explanation:'Registration dates describe the registered domain, not the age or credibility of the business.',
        provenance:{sourceUrl:rdap.source,observedAt:rdap.retrievedAt,method:'Explicit public RDAP lookup'},
        observedValue:[
          `registered domain ${rdap.domain}`,
          rdap.registeredAt ? `registered ${rdap.registeredAt.slice(0,10)}` : undefined,
          rdap.registrar ? `registrar ${rdap.registrar}` : undefined,
        ].filter(Boolean).join(' • ') || 'RDAP record retrieved',
        independentKey:'rdap-domain-chronology',
      };

      const evidence=[
        ...report.evidence.filter(e=>e.independentKey!=='rdap-domain-chronology'),
        rdapInfo,
        ...added.filter(newItem=>!report.evidence.some(old=>old.independentKey===newItem.independentKey)),
      ];
      const next:DropShredderReport={
        ...report,
        evidence,
        contradictions:[
          ...report.contradictions.filter(c=>!contradictions.some(n=>n.independentKey===c.independentKey)),
          ...contradictions,
        ],
        verdict:calculateVerdict(evidence),
      };
      lastReport=next;
      renderReport(next);
      try{ await saveObservation(next); }catch{}
      status.textContent=tr('Domain registration information retrieved. It does not establish the business’s age.');
  }catch(error){
    if(domainRequest===active) status.textContent=active.signal.aborted?tr('Domain lookup canceled.'):errorText(error);
  }finally{
    if(domainRequest===active) stopDomainLookup();
  }
});


reputationSweep?.addEventListener('click',()=>void (async()=>{
  const report=lastReport;
  if(!report) return;
  try{
    await verifiedReportPage(report);
    const target={
      merchantName:report.merchant.businessName || report.merchant.sellerName,
      domain:report.merchant.domain,
    };
    await openSearches(reputationSearchUrls(target));
    if(status) status.textContent=tr('Buyer-review searches opened. Compare the complaints before you trust the store.');
  }catch(error){if(status) status.textContent=errorText(error);}
})());


policyCheck?.addEventListener('click',()=>{
  const report=lastReport;
  if(!report || !status) return;
  void (async()=>{
    status.textContent=tr('Reading the return policy for expensive catches and hoops…');
    try{
      const page=await verifiedReportPage(report);

      const [result]=await chrome.scripting.executeScript({
        target:documentTarget(page),
        func:()=>{
          const anchors=document.getElementsByTagName('a');
          for(let i=0;i<Math.min(anchors.length,1200);i++){
            const a=anchors.item(i);
            if(!a?.href) continue;
            try{
              const url=new URL(a.href,location.href);
              if(url.origin!==location.origin || url.href.length>2048) continue;
              if(/return|refund|shipping-policy|policies\/refund/i.test(url.pathname+' '+(a.innerText||'').slice(0,250))) return url.href;
            }catch{}
          }
          return undefined;
        },
      });

      const policyUrl=result?.result as string|undefined;
      if(!policyUrl){
        status.textContent=tr('Couldn’t find a clear return or refund policy on this store.');
        return;
      }

      const [policyResult]=await chrome.scripting.executeScript({
        target:documentTarget(page),
        args:[policyUrl],
        func:async(url:string)=>{
          const response=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(3500)});
          if(!response.ok) throw new Error(tr('Policy fetch failed: HTTP $1',response.status));
          const length=Number(response.headers.get('content-length')||0);
          if(length>2_000_000 || new URL(response.url).origin!==location.origin || !response.body) return undefined;
          const reader=response.body.getReader();
          const decoder=new TextDecoder();
          let html='',size=0;
          try{
            while(true){
              const {done,value}=await reader.read();
              if(done) break;
              size+=value.byteLength;
              if(size>2_000_000) return undefined;
              html+=decoder.decode(value,{stream:true});
            }
            html+=decoder.decode();
          }finally{
            void reader.cancel().catch(()=>{});
          }
          const doc=new DOMParser().parseFromString(html,'text/html');
          return (doc.body?.innerText || '').replace(/\s+/g,' ').slice(0,100000);
        },
      });
      const text=policyResult?.result as string|undefined;
      if(!text) throw new Error('The return policy couldn’t be read clearly enough to judge.');
      const findings=analyzeReturnPolicy(text);
      await verifiedReportPage(report);

      if(!findings.length){
        status.textContent=tr('No obvious return-policy traps stood out.');
        return;
      }

      const evidence=[
        ...report.evidence.filter(existing=>!findings.some(item=>item.independentKey===existing.independentKey)),
        ...findings,
      ];
      const next={...report,evidence,verdict:calculateVerdict(evidence)};
      lastReport=next;
      renderReport(next);
      try{await saveObservation(next);}catch{}
      status.textContent=tr('Return-policy findings to review before buying: $1.',findings.length);
    }catch(error){
      status.textContent=errorText(error);
    }
  })();
});


fulfillmentCheck?.addEventListener('click',()=>{
  const report=lastReport;
  if(!report || !status) return;
  void (async()=>{
    status.textContent=tr('Checking where the order actually appears to ship from…');
    try{
      const page=await verifiedReportPage(report);

      const [result]=await chrome.scripting.executeScript({
        target:documentTarget(page),
        world:'ISOLATED',
        func:()=>({
          text:(()=>{
            if(!document.body) return '';
            const pieces:string[]=[];
            const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
            let nodes=0,chars=0;
            while(nodes<3000 && chars<50000){
              const node=walker.nextNode();
              if(!node) break;
              nodes++;
              if(node.parentElement?.closest('script,style,input,textarea,[contenteditable="true"],[hidden]')) continue;
              const value=(node.nodeValue||'').replace(/\s+/g,' ').trim().slice(0,1000);
              if(value){pieces.push(value);chars+=value.length+1;}
            }
            return pieces.join(' ').slice(0,50000);
          })(),
          url:location.href,
        }),
      });
      const fulfillmentPage=result?.result as {text:string;url:string}|undefined;
      await verifiedReportPage(report);
      if(!fulfillmentPage?.text) throw new Error('Couldn’t find enough shipping information on this page to tell.');

      const observation=parseFulfillmentObservation(fulfillmentPage.text);
      if(!observation.origin){
        status.textContent=observation.carrier
          ? tr('Carrier $1 detected, but no explicit shipment origin was found. No contradiction scored.',observation.carrier)
          : tr('The page doesn’t clearly say where the order ships from.');
        return;
      }

      const claims=extractClaims(report.product.claims.join(' '));
      const contradictions=fulfillmentContradictions(claims,{
        origin:observation.origin,
        carrier:observation.carrier,
        routeText:observation.routeText,
        source:fulfillmentPage.url,
      });
      const added=contradictionEvidence(contradictions);
      const originInfo={
        id:'FULFILLMENT_ORIGIN_OBSERVATION',
        family:'fulfillment' as const,
        severity:'info' as const,
        confidence:observation.confidence,
        weight:0,
        title:'Explicit shipment-origin evidence captured',
        explanation:'The active tracking/fulfillment page explicitly exposed a shipment origin. This is informational unless it conflicts with a seller claim.',
        observedValue:[observation.origin,observation.carrier].filter(Boolean).join(' • '),
        independentKey:'fulfillment-origin-observation',
      };

      const evidence=[
        ...report.evidence.filter(e=>
          e.independentKey!=='fulfillment-origin-observation' &&
          !added.some(item=>item.independentKey===e.independentKey)
        ),
        originInfo,
        ...added,
      ];
      const next:DropShredderReport={
        ...report,
        evidence,
        contradictions:[
          ...report.contradictions.filter(c=>!contradictions.some(n=>n.independentKey===c.independentKey)),
          ...contradictions,
        ],
        verdict:calculateVerdict(evidence),
      };
      lastReport=next;
      renderReport(next);
      try{await saveObservation(next);}catch{}
      status.textContent=contradictions.length
        ? tr('Where the order ships from doesn’t match the seller’s claim. Check the receipts.')
        : tr('The shipping origin doesn’t contradict what the seller says.');
    }catch(error){
      status.textContent=errorText(error);
    }
  })();
});


clearHistory?.addEventListener('click',()=>{
  if(!status) return;
  void (async()=>{
    clearHistory.disabled=true;
    try{
      await clearObservationHistory();
      status.textContent=tr('Your saved DropShredder scan history is deleted.');
    }catch(error){
      status.textContent=errorText(error);
    }finally{
      clearHistory.disabled=false;
    }
  })();
});


revokeOptionalAccess?.addEventListener('click',()=>{
  if(!status) return;
  void (async()=>{
    revokeOptionalAccess.disabled=true;
    try{
      // The opt-in setting is the first and definitive protection gate.
      // Cleanup may race the worker's permissions.onRemoved reconciliation.
      await updateFeatureSettings({autoProtection:false});
      if(autoProtection) autoProtection.checked=false;
      const granted=await chrome.permissions.getAll();
      const origins=(granted.origins ?? []).filter(origin=>origin.startsWith('https://'));
      if(origins.length) await chrome.permissions.remove({origins});
      await setAutoContentRegistration(false);
      const remaining=(await chrome.permissions.getAll()).origins ?? [];
      if(remaining.some(origin=>origin.startsWith('https://')))
        throw new Error('Chrome kept a site permission; check extension site access.');
      status.textContent=origins.length
        ? tr('Extra site access removed.')
        : tr('DropShredder didn’t have any extra site access to remove.');
    }catch(error){
      status.textContent=errorText(error);
    }finally{
      revokeOptionalAccess.disabled=false;
    }
  })();
});
