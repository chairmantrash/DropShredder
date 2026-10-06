import type { DropShredderReport } from '../types/report';

const HOST_ID='dropshredder-stamp-host';

function label(report: DropShredderReport): {headline:string;detail:string} {
  const v=report.verdict;
  if (v.severeWarningAllowed) return {
    headline:'⚠ STRONG DROPSHIP / RESELL EVIDENCE',
    detail:'Independent evidence families crossed the severe-warning gate.',
  };
  if ((v.massResellLikelihood ?? 0) >= 35) return {
    headline:'⚠ SOMETHING SMELLS OFF',
    detail:'Risk signals detected, but the evidence is not strong enough for a severe accusation.',
  };
  if (report.evidence.length) return {
    headline:'DROPSHREDDER • SIGNALS FOUND',
    detail:'Weak or moderate indicators only. Treat this as a prompt to investigate, not a verdict.',
  };
  return {
    headline:'DROPSHREDDER • NO VERDICT',
    detail:'No meaningful passive evidence yet. Deep Hunt can investigate provenance and seller identity.',
  };
}

export function renderStamp(report: DropShredderReport): void {
  document.getElementById(HOST_ID)?.remove();
  const host=document.createElement('div');
  host.id=HOST_ID;
  host.style.cssText='all:initial;position:fixed;right:16px;top:96px;z-index:2147483647;';
  const shadow=host.attachShadow({mode:'open'});
  const state=label(report);
  const score=report.verdict.massResellLikelihood;

  const style=document.createElement('style');
  style.textContent=`
    .box{position:relative;width:310px;background:#0d0d0f;color:#fafafa;border:2px solid #ff453a;border-radius:10px;
      box-shadow:0 14px 44px rgba(0,0,0,.48);font-family:Inter,system-ui,sans-serif;padding:14px}
    .brand{font-size:11px;font-weight:900;letter-spacing:.16em;color:#ff453a;margin-bottom:8px}
    .headline{font-size:15px;font-weight:950;line-height:1.15}
    .detail{font-size:12px;line-height:1.4;color:#b9b9c0;margin-top:8px}
    .score{font-size:12px;margin-top:10px;color:#ededf0}
    button{all:initial;position:absolute;right:8px;top:5px;color:#b9b9c0;font:700 18px system-ui;cursor:pointer;padding:4px}
  `;

  const box=document.createElement('div');
  box.className='box';
  const close=document.createElement('button');
  close.type='button';
  close.setAttribute('aria-label','Dismiss DropShredder warning');
  close.textContent='×';
  close.addEventListener('click',()=>host.remove());

  const brand=document.createElement('div');
  brand.className='brand';
  brand.textContent='DROP SHREDDER';
  const headline=document.createElement('div');
  headline.className='headline';
  headline.textContent=state.headline;
  const detail=document.createElement('div');
  detail.className='detail';
  detail.textContent=state.detail;
  const scoreNode=document.createElement('div');
  scoreNode.className='score';
  scoreNode.textContent=`${score===null?'Mass-resell likelihood: UNKNOWN':`Mass-resell likelihood: ${score}%`} • ${report.evidence.length} signal(s)`;

  box.append(close,brand,headline,detail,scoreNode);
  shadow.append(style,box);
  document.documentElement.append(host);
}
