import './style.css';
import { calculateVerdict } from '../../src/analysis/evidence-engine';
import { runPassiveRules } from '../../src/analysis/passive-rules';
import type { DropShredderReport } from '../../src/types/report';
import type { ProductSnapshot } from '../../src/types/product';
import { getObservations, getRecentObservationsAll, productIdentityKey, saveObservation } from '../../src/storage/history';
import { analyzeHistory } from '../../src/analysis/history-signals';
import { analyzeReviewProvenance } from '../../src/analysis/review-provenance';
import type { ReviewSnapshot } from '../../src/types/review';
import { extractClaims } from '../../src/analysis/claims';
import { buildProductFingerprint } from '../../src/forensics/product-fingerprint';
import { analyzeEtsyPage } from '../../src/adapters/etsy';
import { imageSearchUrls, merchantSearchUrls, productSearchUrls } from '../../src/deep-hunt/search-urls';
import { captureImageFingerprint } from '../../src/forensics/image-acquisition';
import { imageHistoryEvidence } from '../../src/forensics/image-history';
import { lookupDomainRdap } from '../../src/osint/rdap';
import { businessAgeContradictions, contradictionEvidence } from '../../src/analysis/contradictions';
import { loadFeatureSettings, saveFeatureSettings } from '../../src/settings/features';
import { indexedSourceEvidence } from '../../src/analysis/source-match';
import { reputationSearchUrls } from '../../src/reputation/reputation-search';
import { analyzeReturnPolicy } from '../../src/analysis/return-policy';
import { productMutationEvidence } from '../../src/analysis/product-mutation';
import { parseFulfillmentObservation } from '../../src/analysis/fulfillment-observation';
import { fulfillmentContradictions } from '../../src/analysis/contradictions';
import { analyzeMerchantOrigin, type SiteTextPage } from '../../src/analysis/merchant-origin';
import { catalogEvidence, type CatalogSnapshot } from '../../src/analysis/catalog-signals';
import { fetchTrustpilotObservation } from '../../src/reputation/trustpilot';
import { analyzeReputationObservations } from '../../src/reputation/complaint-analysis';
import { qualityClaimEvidence } from '../../src/analysis/quality-claims';
import { reviewDiscrepancyEvidence, type HostedReviewSummary } from '../../src/reputation/review-discrepancy';
import { detectCommercePlatforms } from '../../src/intelligence/commerce-platforms';
import { buildSupplyChainProfile, detectPaymentProcessors } from '../../src/analysis/supply-chain-profile';
import { merchantNetworkEvidence, merchantNetworkForDomain } from '../../src/intelligence/merchant-networks';
import { crossDomainReferenceEvidence, localMerchantNetworkEvidence } from '../../src/analysis/merchant-network';

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
const autoReputationSweep=document.querySelector<HTMLInputElement>('#auto-reputation-sweep');
const preferMadeInUSA=document.querySelector<HTMLInputElement>('#prefer-made-in-usa');
const reputationSweep=document.querySelector<HTMLButtonElement>('#reputation-sweep');
const policyCheck=document.querySelector<HTMLButtonElement>('#policy-check');
const fulfillmentCheck=document.querySelector<HTMLButtonElement>('#fulfillment-check');
let lastReport:DropShredderReport|undefined;
void loadFeatureSettings().then(settings=>{
  if(autoSourceHunt) autoSourceHunt.checked=settings.autoSourceHunt;
  if(autoReputationSweep) autoReputationSweep.checked=settings.autoReputationSweep;
  if(preferMadeInUSA) preferMadeInUSA.checked=settings.preferMadeInUSA;
});

autoSourceHunt?.addEventListener('change',()=>{
  void loadFeatureSettings().then(settings=>
    saveFeatureSettings({...settings,autoSourceHunt:autoSourceHunt.checked})
  );
});

preferMadeInUSA?.addEventListener('change',()=>{
  void loadFeatureSettings().then(settings=>
    saveFeatureSettings({...settings,preferMadeInUSA:preferMadeInUSA.checked})
  );
});

autoReputationSweep?.addEventListener('change',()=>{
  void (async()=>{
    if(autoReputationSweep.checked){
      const origin='https://www.trustpilot.com/*';
      const granted=await chrome.permissions.contains({origins:[origin]})
        || await chrome.permissions.request({origins:[origin]});
      if(!granted){
        autoReputationSweep.checked=false;
        if(status) status.textContent='Auto Reputation Sweep needs optional Trustpilot access.';
      }
    }
    const settings=await loadFeatureSettings();
    await saveFeatureSettings({...settings,autoReputationSweep:autoReputationSweep.checked});
  })();
});

function renderReport(report: DropShredderReport): void {
  if (!summary || !evidenceList || !raw) return;
  lastReport=report;
  if(huntActions) huntActions.hidden=false;
  const score=report.verdict.massResellLikelihood;
  summary.innerHTML=`
    <div class="metric"><span>Mass-resell likelihood</span><strong>${score===null?'UNKNOWN':score+'%'}</strong></div>
    <div class="metric"><span>Dropship likelihood</span><strong>${report.verdict.dropshipLikelihood===null?'UNKNOWN':report.verdict.dropshipLikelihood+'%'}</strong></div>
    <div class="metric"><span>Deception risk</span><strong>${report.verdict.deceptionRisk.toUpperCase()}</strong></div>
    <div class="metric"><span>Merchant risk</span><strong>${report.verdict.merchantRisk.toUpperCase()}</strong></div>
    <div class="metric"><span>Manipulation risk</span><strong>${report.verdict.manipulationRisk.toUpperCase()}</strong></div>
    <div class="metric"><span>Fulfillment risk</span><strong>${report.verdict.fulfillmentRisk.toUpperCase()}</strong></div>
    <div class="metric"><span>Supply chain</span><strong>${report.supplyChain?.label ?? 'UNKNOWN'}</strong></div>
    <div class="metric"><span>Payment / banking chain</span><strong>${report.supplyChain?.paymentChainLabel ?? 'UNKNOWN'}</strong></div>
    <div class="gate">${report.supplyChain?.preferenceNote ?? ''}</div>
    <div class="gate">${report.verdict.reason}</div>`;

  evidenceList.innerHTML='';
  if (!report.evidence.length) {
    evidenceList.innerHTML='<div class="empty">No meaningful passive evidence yet. Deep Hunt will add provenance, supplier, domain, review, and merchant-network evidence.</div>';
  } else {
    for (const item of report.evidence) {
      const row=document.createElement('article');
      row.className='evidence-row';

      const head=document.createElement('div');
      head.className='evidence-head';
      const severity=document.createElement('span');
      severity.textContent=item.severity.toUpperCase();
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

async function scanActivePage(): Promise<void> {
  if (!scanButton || !status) return;
  scanButton.disabled=true;
  status.textContent='Inspecting this page locally…';

  try {
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if (!tab?.id) throw new Error('No active tab is available.');

    const [execution]=await chrome.scripting.executeScript({
      target:{tabId:tab.id},
      func:()=>{
        const meta=(selector:string):string|undefined =>
          document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined;
        const canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || undefined;

        const jsonNodes: Record<string, unknown>[]=[];
        const walk=(value:unknown):void=>{
          if (Array.isArray(value)) { value.forEach(walk); return; }
          if (!value || typeof value!=='object') return;
          const record=value as Record<string,unknown>;
          jsonNodes.push(record);
          if (Array.isArray(record['@graph'])) walk(record['@graph']);
        };
        for (const script of document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')) {
          try { walk(JSON.parse(script.textContent || 'null')); } catch {}
        }
        const product=jsonNodes.find(node=>{
          const t=node['@type'];
          return t==='Product' || (Array.isArray(t) && t.includes('Product'));
        });
        const asRecord=(v:unknown):Record<string,unknown>|undefined =>
          v && typeof v==='object' && !Array.isArray(v) ? v as Record<string,unknown> : undefined;
        const first=(v:unknown):string|undefined=>{
          if (typeof v==='string') return v.trim() || undefined;
          if (Array.isArray(v)) return v.find(x=>typeof x==='string') as string|undefined;
          return undefined;
        };
        const offer=asRecord(Array.isArray(product?.offers)?product?.offers[0]:product?.offers);
        const brand=asRecord(product?.brand);
        const seller=asRecord(offer?.seller ?? product?.seller);
        const aggregateNode=asRecord(product?.aggregateRating)
          ?? asRecord(jsonNodes.find(node=>Boolean(node.aggregateRating))?.aggregateRating);
        const hostedRating=Number(aggregateNode?.ratingValue) || undefined;
        const hostedReviewCount=Number(aggregateNode?.reviewCount ?? aggregateNode?.ratingCount) || undefined;
        const imageValue=product?.image;
        const structuredImages=Array.isArray(imageValue)
          ? imageValue.filter((x):x is string=>typeof x==='string')
          : typeof imageValue==='string'?[imageValue]:[];
        const amazonAsin=/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i.exec(location.pathname)?.[1]?.toUpperCase();
        const amazonSeller=(
          document.querySelector<HTMLElement>('#sellerProfileTriggerId')?.innerText
          || document.querySelector<HTMLElement>('#merchant-info a')?.innerText
          || document.querySelector<HTMLElement>('#tabular-buybox-truncate-1 .a-truncate-full')?.innerText
          || ''
        ).replace(/\s+/g,' ').trim() || undefined;

        const additionalProperties=Array.isArray(product?.additionalProperty)
          ? product?.additionalProperty
          : product?.additionalProperty ? [product.additionalProperty] : [];
        const specifications:Record<string,string>={};
        for(const entry of additionalProperties){
          const record=asRecord(entry);
          const name=first(record?.name);
          const value=first(record?.value);
          if(name && value && Object.keys(specifications).length<40) specifications[name]=value;
        }

        const pageText=(document.body?.innerText || '').slice(0,120000);
        const shippingMatch=pageText.match(/(?:shipping|delivery)[^\n]{0,100}(?:\d+\s*(?:-|to|–)\s*\d+\s+(?:business\s+)?days)/i);

        const classifyLink=(a:HTMLAnchorElement):'about'|'shipping'|'returns'|'contact'|undefined=>{
          const haystack=(a.pathname+' '+(a.innerText||'')).toLowerCase();
          if(/about|our story|who we are/.test(haystack)) return 'about';
          if(/shipping|delivery/.test(haystack)) return 'shipping';
          if(/return|refund|exchange/.test(haystack)) return 'returns';
          if(/contact/.test(haystack)) return 'contact';
          return undefined;
        };
        const siteLinks=[...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
          .map(a=>{
            try{
              const url=new URL(a.href,location.href);
              const kind=classifyLink(a);
              return url.origin===location.origin && kind ? {kind,url:url.href} : undefined;
            }catch{return undefined;}
          })
          .filter((v):v is {kind:'about'|'shipping'|'returns'|'contact';url:string}=>Boolean(v))
          .filter((v,i,arr)=>arr.findIndex(x=>x.kind===v.kind)===i)
          .slice(0,4);

        const cardSelectors=[
          '[class*="product-card"]','[class*="product_card"]','[class*="product-item"]',
          '[class*="product_item"]','[data-product-id]','li[class*="product"]'
        ];
        const cards=[...new Set(cardSelectors.flatMap(selector=>[...document.querySelectorAll<HTMLElement>(selector)]))]
          .filter(card=>card.innerText.trim().length>0)
          .slice(0,200);
        const saleCards=cards.filter(card=>
          Boolean(card.querySelector('del,s,[class*="compare"],[class*="was-price"],[class*="sale-price"]'))
          || /\b(?:sale|save\s+\d+%|\d+%\s+off)\b/i.test(card.innerText)
        );
        const catalog={cardCount:cards.length,saleCardCount:saleCards.length};

        const reviews=[...document.querySelectorAll<HTMLElement>('[data-hook="review"]')]
          .slice(0,80)
          .map((review,index)=>{
            const text=(selector:string)=>(review.querySelector<HTMLElement>(selector)?.innerText || '').replace(/\s+/g,' ').trim();
            const ratingText=text('[data-hook="review-star-rating"], [data-hook="cmps-review-star-rating"]');
            const ratingMatch=ratingText.match(/([1-5](?:\.\d)?)/);
            return {
              id:review.id || `visible-review-${index}`,
              platform:'amazon',
              rating:ratingMatch ? Number(ratingMatch[1]) : undefined,
              title:text('[data-hook="review-title"]'),
              body:text('[data-hook="review-body"], [data-hook="reviewText"], [data-hook="reviewRichContentContainer"]'),
              date:text('[data-hook="review-date"]') || undefined,
              verified:Boolean(review.querySelector('[data-hook="avp-badge"]')),
              helpfulCount:Number((text('[data-hook="helpful-vote-statement"]').match(/\d+/)?.[0])) || undefined,
              reviewerName:text('.a-profile-name') || undefined,
            };
          })
          .filter(review=>review.body);

        return {
          product:{
            url:location.href,
            domain:location.hostname,
            canonicalUrl:canonical,
            title:first(product?.name) || meta('meta[property="og:title"]') || document.title?.trim() || undefined,
            description:first(product?.description) || meta('meta[property="og:description"]') || meta('meta[name="description"]'),
            price:Number(offer?.price) || undefined,
            currency:first(offer?.priceCurrency),
            brand:first(brand?.name ?? product?.brand),
            seller:first(seller?.name ?? offer?.seller ?? product?.seller) || amazonSeller,
            sku:first(product?.sku),
            asin:amazonAsin,
            mpn:first(product?.mpn),
            gtin:first(product?.gtin ?? product?.gtin13 ?? product?.gtin12 ?? product?.gtin14 ?? product?.gtin8),
            imageUrls:[...new Set([...structuredImages,...[...document.images].map(i=>i.currentSrc||i.src).filter(Boolean)])].slice(0,30),
            jsonLdProductCount:jsonNodes.filter(node=>{
              const t=node['@type'];
              return t==='Product' || (Array.isArray(t) && t.includes('Product'));
            }).length,
            capturedAt:new Date().toISOString(),
            shippingText:shippingMatch?.[0],
            claims:[],
            specifications,
            pageSignals:[
              ...(('Shopify' in window || [...document.scripts].some(s=>s.src.includes('cdn.shopify.com')) || document.querySelector('link[href*="cdn.shopify.com"]'))
                ? ['platform:shopify'] : []),
              ...((document.body?.classList.contains('woocommerce') || [...document.scripts].some(s=>/wc-(?:cart|checkout|add-to-cart)/i.test(s.src)))
                ? ['platform:woocommerce'] : []),
              ...(([...document.scripts].some(s=>s.src.includes('bigcommerce.com')) || document.querySelector('[data-content-region]'))
                ? ['platform:bigcommerce'] : []),
              ...((document.querySelector('script[src*="requirejs"], script[src*="/static/version"]') || 'mage' in window)
                ? ['platform:magento'] : []),
              ...(([...document.scripts].some(s=>/myshopline\.com|shoplineapp\.com/i.test(s.src))
                || [...document.images].some(i=>/myshopline\.com/i.test(i.currentSrc||i.src))
                || document.querySelector('link[href*="myshopline.com"], meta[content*="SHOPLINE"]'))
                ? ['platform:shopline'] : []),
              ...(document.querySelector('#looxReviews, .loox-rating') || [...document.scripts].some(s=>s.src.includes('loox.io/widget/loox.js'))
                ? ['review-platform:loox'] : []),
              ...(document.querySelector('#judgeme_product_reviews, .jdgm-widget, .jdgm-review-widget, .jdgm-preview-badge')
                ? ['review-platform:judgeme'] : []),
              ...([...document.scripts].some(s=>s.src.includes('track123.com/track123-widget.min.js') || s.src.includes('shp.track123.com/tracking-page/build/widget.min.js'))
                || document.querySelector('#track123-tracking-widget, track123-tracking-widget')
                ? ['tracking-platform:track123'] : []),
              ...([...document.scripts].some(s=>s.src.includes('parcelpanel.com/assets/tracking/track-page.js') || s.src.includes('shopify-edd.parcelpanel.com/loader.js'))
                || document.querySelector('#pp-tracking-page-app, #pp-tracking-shop, parcelpanel-edd')
                ? ['tracking-platform:parcelpanel'] : []),
            ],
          },
          pageText,
          reviews,
          siteLinks,
          catalog,
          hostedReviews: hostedRating ? {
            rating: hostedRating,
            reviewCount: hostedReviewCount,
            source:'Store-hosted structured reviews',
          } : undefined,
          scriptSources:[...document.scripts].map(s=>s.src).filter(Boolean).slice(0,300),
          htmlSignature:(document.head?.innerHTML || '').slice(0,80000)+' '+(document.body?.className || ''),
        };
      },
    });

    const result=execution?.result as {product:ProductSnapshot;pageText:string;reviews:ReviewSnapshot[];siteLinks:Array<{kind:'about'|'shipping'|'returns'|'contact';url:string}>;catalog:CatalogSnapshot;hostedReviews?:HostedReviewSummary;scriptSources:string[];htmlSignature:string}|undefined;
    if (!result) throw new Error('The page did not return a scan result.');

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
          target:{tabId:tab.id},
          args:[result.siteLinks],
          func:async(links:Array<{kind:'about'|'shipping'|'returns'|'contact';url:string}>)=>{
            const pages:Array<{kind:'about'|'shipping'|'returns'|'contact';url:string;text:string}>=[];
            for(const link of links.slice(0,4)){
              try{
                const response=await fetch(link.url,{credentials:'same-origin',cache:'force-cache'});
                if(!response.ok) continue;
                const html=await response.text();
                const doc=new DOMParser().parseFromString(html,'text/html');
                const text=(doc.body?.innerText || '').replace(/\s+/g,' ').slice(0,80000);
                if(text) pages.push({...link,text});
              }catch{}
            }
            return pages;
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
        title:'Stable product identifiers recovered',
        explanation:'Stable identifiers improve upstream matching and chronology checks. Their presence is informational, not negative evidence.',
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
    if (/(^|\\.)etsy\\.com$/i.test(result.product.domain)) {
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
        title:'Does not appear to match Made in USA preference',
        explanation:'The identified merchant/manufacturing/fulfillment/return chain includes material international components. This is a shopper preference notice, not evidence of wrongdoing.',
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

      if(settings.autoReputationSweep){
        try{
          const observation=await fetchTrustpilotObservation(report.product.domain);
          if(observation){
            const reputationEvidence=[
              ...analyzeReputationObservations([observation]),
              ...qualityClaimEvidence(result.pageText,[observation]),
              ...reviewDiscrepancyEvidence(result.hostedReviews,observation),
            ];
            if(reputationEvidence.length){
              const combined=[
                ...report.evidence.filter(existing=>!reputationEvidence.some(item=>item.independentKey===existing.independentKey)),
                ...reputationEvidence,
              ];
              report={...report,evidence:combined,verdict:calculateVerdict(combined)};
            }
          }
        }catch(reputationError){
          console.warn('DropShredder: automatic Trustpilot sweep failed',reputationError);
        }
      }
    } catch (historyError) {
      console.warn('DropShredder: local history/source-index read failed', historyError);
    }

    renderReport(report);

    try {
      await saveObservation(report);
    } catch (storageError) {
      console.warn('DropShredder: local history write failed', storageError);
    }

    await chrome.scripting.executeScript({
      target:{tabId:tab.id},
      args:[report.verdict.massResellLikelihood,report.evidence.length,report.verdict.severeWarningAllowed],
      func:(score:number|null,count:number,severe:boolean)=>{
        document.getElementById('dropshredder-stamp-host')?.remove();
        const host=document.createElement('div');
        host.id='dropshredder-stamp-host';
        host.style.cssText='all:initial;position:fixed;right:16px;top:96px;z-index:2147483647;';
        const shadow=host.attachShadow({mode:'open'});
        const headline=severe
          ? '⚠ STRONG DROPSHIP / RESELL EVIDENCE'
          : count>0 ? '⚠ DROPSHREDDER SIGNALS FOUND' : 'DROPSHREDDER • NO VERDICT';
        shadow.innerHTML=`<style>
          .box{width:310px;background:#0d0d0f;color:#fafafa;border:2px solid #ff453a;border-radius:10px;
            box-shadow:0 14px 44px rgba(0,0,0,.48);font-family:system-ui,sans-serif;padding:14px}
          .brand{font-size:11px;font-weight:900;letter-spacing:.16em;color:#ff453a;margin-bottom:8px}
          .headline{font-size:15px;font-weight:950;line-height:1.15}
          .detail{font-size:12px;line-height:1.4;color:#b9b9c0;margin-top:8px}
        </style><div class="box"><div class="brand">DROP SHREDDER</div><div class="headline">${headline}</div>
        <div class="detail">${score===null?'Mass-resell likelihood: UNKNOWN':`Mass-resell likelihood: ${score}%`} • ${count} signal(s)<br>
        ${severe?'Independent evidence gate satisfied.':'Evidence gate not satisfied; this is not a severe accusation.'}</div></div>`;
        document.documentElement.append(host);
      },
    });

    status.textContent=`Scan complete for ${result.product.domain}.`;
  } catch (error) {
    status.textContent=error instanceof Error?error.message:String(error);
  } finally {
    scanButton.disabled=false;
  }
}

scanButton?.addEventListener('click',()=>void scanActivePage());

async function openSearches(urls:Record<string,string>):Promise<void>{
  for(const url of Object.values(urls)) await chrome.tabs.create({url,active:false});
}

huntSources?.addEventListener('click',()=>{
  const title=lastReport?.product.title;
  if(title) void openSearches(productSearchUrls(title));
});
huntImage?.addEventListener('click',()=>{
  const image=lastReport?.product.imageUrls[0];
  if(!image){
    void openSearches(imageSearchUrls());
    return;
  }

  void (async()=>{
    if(status) status.textContent='Fingerprinting the selected image locally…';
    try {
      const fingerprint=await captureImageFingerprint(image);
      if(fingerprint && lastReport){
        const existing=lastReport.product.imageFingerprints ?? [];
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
          ...lastReport.product,
          imageFingerprints:[...existing.filter(item=>item.url!==image),fingerprint],
        };
        let nextEvidenceList=[...lastReport.evidence.filter(e=>e.independentKey!==nextEvidence.independentKey),nextEvidence];

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

        lastReport={
          ...lastReport,
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
      if(status) status.textContent='Image hunt launched.';
      await openSearches(imageSearchUrls(image));
    }
  })();
});
huntStore?.addEventListener('click',()=>{
  const domain=lastReport?.product.domain;
  if(domain) void openSearches(merchantSearchUrls(domain));
});


checkDomain?.addEventListener('click',()=>{
  const report=lastReport;
  if(!report || !status) return;
  void (async()=>{
    status.textContent='Checking public RDAP registration data…';
    try{
      const rdap=await lookupDomainRdap(report.product.domain);
      if(!rdap){
        status.textContent='RDAP check cancelled or unavailable.';
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
        explanation:'Public RDAP domain chronology is informational by itself. It becomes relevant when it conflicts with an explicit seller business-age claim.',
        observedValue:[
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
      status.textContent=contradictions.length
        ? 'Domain chronology conflicts with a seller claim. Review the evidence.'
        : 'Domain chronology checked. No business-age contradiction found.';
    }catch(error){
      status.textContent=error instanceof Error ? error.message : String(error);
    }
  })();
});


reputationSweep?.addEventListener('click',()=>{
  const report=lastReport;
  if(!report) return;
  const target={
    merchantName:report.merchant.businessName || report.merchant.sellerName,
    domain:report.merchant.domain,
  };
  void openSearches(reputationSearchUrls(target));
  if(status) status.textContent='Public reputation searches launched across Trustpilot, Sitejabber, ConsumerAffairs, BBB, Google reviews, and Reddit.';
});


policyCheck?.addEventListener('click',()=>{
  const report=lastReport;
  if(!report || !status) return;
  void (async()=>{
    status.textContent='Looking for a same-site return/refund policy…';
    try{
      const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
      if(!tab?.id) throw new Error('No active tab is available.');

      const [result]=await chrome.scripting.executeScript({
        target:{tabId:tab.id},
        func:()=>{
          const policyLink=[...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
            .map(a=>({href:a.href,text:(a.innerText||'').replace(/\s+/g,' ').trim()}))
            .find(item=>{
              try{
                const url=new URL(item.href,location.href);
                if(url.origin!==location.origin) return false;
                return /return|refund|shipping-policy|policies\/refund/i.test(url.pathname+' '+item.text);
              }catch{return false;}
            });
          return policyLink?.href;
        },
      });

      const policyUrl=result?.result as string|undefined;
      if(!policyUrl){
        status.textContent='No same-site return/refund policy link was found.';
        return;
      }

      const [policyResult]=await chrome.scripting.executeScript({
        target:{tabId:tab.id},
        args:[policyUrl],
        func:async(url:string)=>{
          const response=await fetch(url,{credentials:'same-origin',cache:'no-store'});
          if(!response.ok) throw new Error(`Policy fetch failed: HTTP ${response.status}`);
          const html=await response.text();
          const doc=new DOMParser().parseFromString(html,'text/html');
          return (doc.body?.innerText || '').replace(/\s+/g,' ').slice(0,100000);
        },
      });
      const text=policyResult?.result as string|undefined;
      if(!text) throw new Error('Return/refund policy page did not return readable text.');
      const findings=analyzeReturnPolicy(text);

      if(!findings.length){
        status.textContent='Return/refund policy checked. No targeted friction patterns found.';
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
      status.textContent=`Return/refund policy checked: ${findings.length} relevant friction signal(s) found.`;
    }catch(error){
      status.textContent=error instanceof Error?error.message:String(error);
    }
  })();
});


fulfillmentCheck?.addEventListener('click',()=>{
  const report=lastReport;
  if(!report || !status) return;
  void (async()=>{
    status.textContent='Reading explicit fulfillment evidence from the active page…';
    try{
      const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
      if(!tab?.id) throw new Error('No active tab is available.');

      const [result]=await chrome.scripting.executeScript({
        target:{tabId:tab.id},
        func:()=>({
          text:(document.body?.innerText || '').replace(/\s+/g,' ').slice(0,50000),
          url:location.href,
        }),
      });
      const page=result?.result as {text:string;url:string}|undefined;
      if(!page?.text) throw new Error('No readable tracking/fulfillment text was found.');

      const observation=parseFulfillmentObservation(page.text);
      if(!observation.origin){
        status.textContent=observation.carrier
          ? `Carrier ${observation.carrier} detected, but no explicit shipment origin was found. No contradiction scored.`
          : 'No explicit shipment origin was found. No contradiction scored.';
        return;
      }

      const claims=extractClaims(report.product.claims.join(' '));
      const contradictions=fulfillmentContradictions(claims,{
        origin:observation.origin,
        carrier:observation.carrier,
        routeText:observation.routeText,
        source:page.url,
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
        ? 'Fulfillment evidence conflicts with an explicit seller shipping-origin claim.'
        : 'Fulfillment origin recorded. No seller-origin contradiction found.';
    }catch(error){
      status.textContent=error instanceof Error?error.message:String(error);
    }
  })();
});
