import './style.css';
import { calculateVerdict } from '../../src/analysis/evidence-engine';
import { runPassiveRules } from '../../src/analysis/passive-rules';
import type { DropShredderReport } from '../../src/types/report';
import type { ProductSnapshot } from '../../src/types/product';
import { getObservations, productIdentityKey, saveObservation } from '../../src/storage/history';
import { analyzeHistory } from '../../src/analysis/history-signals';
import { analyzeReviewProvenance } from '../../src/analysis/review-provenance';
import type { ReviewSnapshot } from '../../src/types/review';
import { analyzeEtsyPage } from '../../src/adapters/etsy';

const scanButton=document.querySelector<HTMLButtonElement>('#scan');
const status=document.querySelector<HTMLElement>('#status');
const summary=document.querySelector<HTMLElement>('#summary');
const evidenceList=document.querySelector<HTMLElement>('#evidence');
const raw=document.querySelector<HTMLElement>('#raw');

function renderReport(report: DropShredderReport): void {
  if (!summary || !evidenceList || !raw) return;
  const score=report.verdict.massResellLikelihood;
  summary.innerHTML=`
    <div class="metric"><span>Mass-resell likelihood</span><strong>${score===null?'UNKNOWN':score+'%'}</strong></div>
    <div class="metric"><span>Dropship likelihood</span><strong>${report.verdict.dropshipLikelihood===null?'UNKNOWN':report.verdict.dropshipLikelihood+'%'}</strong></div>
    <div class="metric"><span>Deception risk</span><strong>${report.verdict.deceptionRisk.toUpperCase()}</strong></div>
    <div class="gate">${report.verdict.reason}</div>`;

  evidenceList.innerHTML='';
  if (!report.evidence.length) {
    evidenceList.innerHTML='<div class="empty">No meaningful passive evidence yet. Deep Hunt will add provenance, supplier, domain, review, and merchant-network evidence.</div>';
  } else {
    for (const item of report.evidence) {
      const row=document.createElement('article');
      row.className='evidence-row';
      row.innerHTML=`<div class="evidence-head"><span>${item.severity.toUpperCase()}</span><strong>${item.title}</strong></div>
        <p>${item.explanation}</p>
        ${item.observedValue?`<code>${item.observedValue.replaceAll('<','&lt;')}</code>`:''}`;
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
        const imageValue=product?.image;
        const structuredImages=Array.isArray(imageValue)
          ? imageValue.filter((x):x is string=>typeof x==='string')
          : typeof imageValue==='string'?[imageValue]:[];

        const pageText=(document.body?.innerText || '').slice(0,120000);
        const shippingMatch=pageText.match(/(?:shipping|delivery)[^\n]{0,100}(?:\d+\s*(?:-|to|–)\s*\d+\s+(?:business\s+)?days)/i);

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
            seller:first(seller?.name ?? offer?.seller ?? product?.seller),
            sku:first(product?.sku),
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
            pageSignals:[
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
        };
      },
    });

    const result=execution?.result as {product:ProductSnapshot;pageText:string;reviews:ReviewSnapshot[]}|undefined;
    if (!result) throw new Error('The page did not return a scan result.');

    const evidence=runPassiveRules(result.product,result.pageText);
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
    let report: DropShredderReport={
      version:1,
      product:result.product,
      merchant:{domain:result.product.domain,sellerName:result.product.seller},
      evidence,
      contradictions:[],
      verdict:calculateVerdict(evidence),
    };

    try {
      const key=productIdentityKey(report);
      const previous=await getObservations(key,30);
      const historyEvidence=analyzeHistory(report,previous);
      if(historyEvidence.length){
        report={
          ...report,
          evidence:[...report.evidence,...historyEvidence],
          verdict:calculateVerdict([...report.evidence,...historyEvidence]),
        };
      }
    } catch (historyError) {
      console.warn('DropShredder: local history read failed', historyError);
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
