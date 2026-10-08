import {detectShoppingPage} from '../src/detection/page-facts';
import {extractPageScan} from '../src/extraction/page-scan';
import {runPassiveRules} from '../src/analysis/passive-rules';
import {calculateVerdict} from '../src/analysis/evidence-engine';

type QuickFinding={title:string; severity:string};

function makeToast(title:string,findings:QuickFinding[],pageUrl:string,listedPrice?:string,seller?:string):HTMLElement {
  const host=document.createElement('div');
  host.id='dropshredder-auto-verdict';
  host.style.cssText='all:initial;position:fixed;top:20px;right:18px;z-index:2147483646;';
  const shadow=host.attachShadow({mode:'open'});
  const style=document.createElement('style');
  style.textContent=`
    :host{all:initial}
    @media (prefers-reduced-motion:no-preference) {
      .card{animation:enter .32s ease-out both}
      @keyframes enter{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
    }
    .card{position:relative;width:min(340px,calc(100vw - 36px));border-radius:13px;
      background:#101217;color:#f5f5f8;border:1px solid #49505f;box-shadow:0 10px 35px #0006;
      font:13px/1.4 system-ui,-apple-system,sans-serif;box-sizing:border-box;overflow:hidden}
    .body{width:100%;text-align:left;background:transparent;color:inherit;border:0;padding:13px 39px 14px 15px;
      display:block;cursor:pointer;font:inherit;box-sizing:border-box}
    .body:hover,.body:focus-visible{background:#202531;outline:2px solid #90b9ff;outline-offset:-3px}
    .brand{font-size:10px;letter-spacing:.12em;font-weight:850;color:#ffb06f}
    .heading{font-size:17px;font-weight:800;margin:5px 0 2px}
    .product{color:#c4c7cf;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:12px}
    .facts{margin:8px 0 8px;padding:0;list-style:none;font-size:12px}
    .facts li{margin:3px 0}
    .cta{color:#8ac9ff;font-weight:750;font-size:12px}
    .close{position:absolute;right:7px;top:7px;background:none;color:#bcc2cf;cursor:pointer;
      border:0;font-size:22px;line-height:26px;width:28px;height:28px;border-radius:5px}
    .close:hover,.close:focus-visible{background:#333a4b;color:white}
  `;
  const card=document.createElement('div');card.className='card';
  const body=document.createElement('button');body.className='body';body.type='button';
  body.setAttribute('aria-label','Open DropShredder full product analysis');
  const brand=document.createElement('div');brand.className='brand';brand.textContent='DROPSHREDDER • QUICK CHECK';
  const heading=document.createElement('div');heading.className='heading';
  heading.textContent=findings.length>=2?'Several things to check':findings.length===1?'Something worth checking':'Not enough evidence yet';
  const product=document.createElement('div');product.className='product';product.textContent=title.slice(0,170);
  const facts=document.createElement('ul');facts.className='facts';
  if(findings.length){
    for(const item of findings.slice(0,2)){
      const li=document.createElement('li');li.textContent='• '+item.title.slice(0,150);
      facts.append(li);
    }
  }else{
    const li=document.createElement('li');
    li.textContent='No clear red flags in this quick check. Seller trust is still unknown.';
    facts.append(li);
  }
  if(listedPrice){
    const li=document.createElement('li');li.textContent='Listed price: '+listedPrice.slice(0,50);
    facts.append(li);
  }
  if(seller){
    const li=document.createElement('li');li.textContent='Seller listed as: '+seller.slice(0,80);
    facts.append(li);
  }
  const trust=document.createElement('div');trust.className='cta';
  trust.textContent='Seller trust: NOT VERIFIED';
  const cta=document.createElement('div');cta.className='cta';cta.textContent='Open full check →';
  body.append(brand,heading,product,facts,trust,cta);
  body.addEventListener('click',()=>{
    if(location.href!==pageUrl) return;
    // Chrome sidePanel.open is invoked by the background directly from this user gesture.
    void chrome.runtime.sendMessage({type:'DS_AUTO_OPEN',version:1}).catch(()=>{});
    host.remove();
  });
  const close=document.createElement('button');close.className='close';close.type='button';
  close.setAttribute('aria-label','Dismiss DropShredder quick check');close.textContent='×';
  close.addEventListener('click',()=>host.remove());
  card.append(body,close);shadow.append(style,card);
  return host;
}

export default defineContentScript({
  registration:'runtime',
  matches:[], // Intentionally no manifest host access. Chrome registration is opt-in.
  runAt:'document_idle',
  allFrames:false,
  world:'ISOLATED',
  main(){
    if(window.top!==window || !document.documentElement) return;
    let sequence=0;
    let timeout:number|undefined;
    let toast:HTMLElement|undefined;
    const notified=new Set<string>();

    const remove=()=>{toast?.remove();toast=undefined;};
    const evaluate=async(id:number):Promise<void>=>{
      if(id!==sequence || document.visibilityState!=='visible') return;
      const url=location.href;
      const classification=detectShoppingPage(document,url);
      if(!classification.showToast) return;
      const key=location.origin+location.pathname;
      if(notified.has(key)) return;
      // Reconfirm opt-in after user disables auto protection in an already-injected tab.
      try{
        const reply=await chrome.runtime.sendMessage({type:'DS_AUTO_STATUS',version:1}) as {enabled?:boolean}|undefined;
        if(!reply?.enabled || id!==sequence || location.href!==url) return;
      }catch{return;}
      // No external requests. Only previously guarded, bounded, packaged forensic logic.
      let scan:ReturnType<typeof extractPageScan>;
      try{scan=extractPageScan();}catch{return;}
      if(id!==sequence || location.href!==url || !detectShoppingPage(document,url).showToast) return;
      const evidence=runPassiveRules(scan.product,scan.pageText);
      const verdict=calculateVerdict(evidence);
      const findings=evidence.filter(item=>item.severity==='moderate' || item.severity==='strong' || item.severity==='direct' || item.severity==='weak')
        .filter(item=>item.weight>0).slice(0,2);
      // A fast first pass is never entitled to declare a shop safe or confirm fraud.
      if(verdict.severeWarningAllowed) return;
      notified.add(key);
      if(notified.size>40) notified.delete(notified.values().next().value!);
      remove();
      const price=scan.product.price!==undefined && Number.isFinite(scan.product.price)
        ? [scan.product.currency||'',String(scan.product.price)].filter(Boolean).join(' ')
        : undefined;
      toast=makeToast(scan.product.title||classification.reasons[0]||'Product listing',findings,url,price,scan.product.seller);
      document.documentElement.append(toast);
      const shown=toast;
      window.setTimeout(()=>{if(toast===shown) remove();},12000);
    };
    const schedule=(delay=450)=>{
      sequence++;
      remove();
      if(timeout!==undefined) clearTimeout(timeout);
      const id=sequence;
      timeout=window.setTimeout(()=>{void evaluate(id);},delay);
    };
    schedule(500);
    // At most two extra passes for slow storefront hydration; no observer firehose.
    window.setTimeout(()=>{if(!toast) schedule(300);},1700);
    window.setTimeout(()=>{if(!toast) schedule(300);},3600);
    window.addEventListener('popstate',()=>schedule(500));
    window.addEventListener('hashchange',()=>schedule(500));
    window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible') schedule(550);else remove();});
    // Chrome Navigation API catches history.pushState on SPAs without monkey-patching page scripts.
    const nav=(window as Window & {navigation?:EventTarget}).navigation;
    nav?.addEventListener('navigatesuccess',()=>schedule(500));
  },
});
