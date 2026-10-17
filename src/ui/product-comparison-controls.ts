import {tr,errorText} from '../i18n/index';
import type {DropShredderReport} from '../types/report';
import {comparisonUrl,fetchPublicProduct,publicComparisonEvidence} from '../osint/public-product-comparison';

/** Explicit panel action only. No content-script message can initiate this request. */
export function mountProductComparison(getReport:()=>DropShredderReport|undefined,apply:(r:DropShredderReport)=>void,guard:()=>Promise<boolean>,doc:Document=document){
  const input=doc.getElementById('compare-product-url') as HTMLInputElement|null;
  const button=doc.getElementById('compare-product') as HTMLButtonElement|null;
  const cancel=doc.getElementById('compare-product-cancel') as HTMLButtonElement|null;
  const status=doc.getElementById('compare-product-status');
  let active:AbortController|undefined;
  const stop=()=>{active?.abort();active=undefined;if(button)button.disabled=false;if(cancel)cancel.disabled=true;};
  const reset=()=>{stop();if(input)input.value='';if(status)status.textContent='';};
  cancel?.addEventListener('click',()=>{stop();if(status)status.textContent=tr('Canceled.');});
  button?.addEventListener('click',()=>{
    const report=getReport();if(!report||active||!input||!status)return;
    const url=comparisonUrl(input.value);
    if(!url){status.textContent=tr('Use a public HTTPS product URL without a query or fragment.');return;}
    if(new URL(url).hostname===report.product.domain){status.textContent=tr('Choose a product page from another website.');return;}
    input.value='';const ctl=new AbortController(),origin=new URL(url).origin+'/*';active=ctl;
    button.disabled=true;if(cancel)cancel.disabled=false;status.textContent=tr('Requesting access to the comparison website.');
    // Chrome requires the permission request inside the original user gesture.
    const permission=chrome.permissions.request({origins:[origin]});
    const current=async()=>active===ctl&&!ctl.signal.aborted&&getReport()===report&&await guard()&&getReport()===report&&active===ctl&&!ctl.signal.aborted;
    void permission.then(async allowed=>{
      if(active!==ctl)return;
      if(!allowed){status.textContent=tr('Permission denied or canceled; no request sent.');return;}
      if(!await current()||!await chrome.permissions.contains({origins:[origin]}))return;
      const product=await fetchPublicProduct(url,AbortSignal.any([ctl.signal,AbortSignal.timeout(12_000)]));
      if(!await current()||!await chrome.permissions.contains({origins:[origin]})||!await current())return;
      const finding=publicComparisonEvidence(report.product,product);
      const old=report.evidence.filter(e=>e.id==='PUBLIC_PRODUCT_COMPARISON'&&e.sourceKey!==url).slice(-4);
      apply({...report,evidence:[...report.evidence.filter(e=>e.id!=='PUBLIC_PRODUCT_COMPARISON'),...old,finding]});
      status.textContent=tr('Comparison added to evidence. Product identity and price do not prove dropshipping.');
    }).catch(e=>{if(active===ctl)status.textContent=ctl.signal.aborted?tr('Canceled.'):errorText(e);})
      .finally(()=>{if(active===ctl)stop();});
  });
  chrome.permissions.onRemoved.addListener(({origins})=>{if(origins?.length)reset();});
  doc.getElementById('revoke-optional-access')?.addEventListener('click',reset);
  return {reset};
}
