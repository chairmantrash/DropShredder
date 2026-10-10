import { tr, errorText } from '../i18n/index';
import { applyDisplayPreferences, DEFAULT_DISPLAY, DISPLAY_KEY, normalizeDisplayPreferences } from './preferences';
import { exportCurrentReport, readPanelReport } from '../reporting/export-report';
import { lookupRecallCandidates, type RecallField } from '../osint/cpsc';
import { currentReportAllowed } from './report-guard';

export function mountPanelControls(doc:Document=document) {
  const raw=doc.querySelector<HTMLElement>('#raw'),list=doc.querySelector<HTMLElement>('#evidence');
  const query=doc.querySelector<HTMLInputElement>('#evidence-query'),filter=doc.querySelector<HTMLSelectElement>('#evidence-filter');
  const count=doc.querySelector<HTMLElement>('#evidence-count'),exportButton=doc.querySelector<HTMLButtonElement>('#export-report');
  const status=doc.querySelector<HTMLElement>('#controls-status'),theme=doc.querySelector<HTMLSelectElement>('#display-theme');
  const density=doc.querySelector<HTMLSelectElement>('#display-density'),scale=doc.querySelector<HTMLSelectElement>('#display-scale');
  const recallButton=doc.querySelector<HTMLButtonElement>('#recall-lookup'),cancel=doc.querySelector<HTMLButtonElement>('#recall-cancel');
  const recallQuery=doc.querySelector<HTMLInputElement>('#recall-query'),field=doc.querySelector<HTMLSelectElement>('#recall-field');
  const recallResults=doc.querySelector<HTMLElement>('#recall-results'),recallStatus=doc.querySelector<HTMLElement>('#recall-status');
  const listeners:Array<()=>void>=[];let dirty=false,stored=Promise.resolve(),lastRaw='',lookup:AbortController|undefined;
  const on=(id:string,type:string,fn:()=>void)=>{const el=doc.getElementById(id);if(el){el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));}};
  const showPreferences=(value:unknown)=>{
    const p=applyDisplayPreferences(doc.documentElement,value);
    for(const [select,value] of [[theme,p.theme],[density,p.density],[scale,String(p.textScale)]] as const){
      const option=[...(select?.querySelectorAll<HTMLOptionElement>('option')??[])].find(o=>o.value===value);
      if(option) option.selected=true;
    }
  };
  const savePreferences=()=>{
    dirty=true;const p=normalizeDisplayPreferences({theme:theme?.value,density:density?.value,textScale:Number(scale?.value)});
    showPreferences(p);
    stored=stored.then(()=>chrome.storage.local.set({[DISPLAY_KEY]:p})).catch(()=>{
      if(status) status.textContent=tr('Appearance changed for this panel; saving it was unavailable.');
    });
  };
  for(const id of ['display-theme','display-density','display-scale']) on(id,'change',savePreferences);
  on('reset-display','click',()=>{showPreferences(DEFAULT_DISPLAY);savePreferences();});
  void chrome.storage.local.get(DISPLAY_KEY).then(result=>{if(!dirty) showPreferences(result[DISPLAY_KEY]);}).catch(()=>{
    if(status) status.textContent=tr('Saved appearance is unavailable. Default display is still usable.');
  });
  const stopLookup=()=>{lookup?.abort();lookup=undefined;if(cancel) cancel.disabled=true;};
  const applyFilters=()=>{
    const rows=[...(list?.querySelectorAll<HTMLElement>('.evidence-row')??[])].slice(0,300);
    const search=(query?.value??'').slice(0,100).toLowerCase();let visible=0;
    for(const row of rows){
      const mode=filter?.value??'all',severity=row.dataset.severity;
      const matches=mode==='all'||(mode==='warnings'&&severity!=='info')||(mode==='context'&&severity==='info');
      const hidden=!(matches && (row.textContent??'').slice(0,5000).toLowerCase().includes(search));
      if(row.hidden!==hidden) row.hidden=hidden;
      if(!row.hidden) visible++;
    }
    if(count) count.textContent=tr('$1 of $2 displayed items shown$3.',visible,rows.length,visible<rows.length?tr(' — filters do not change the verdict'):'');
  };
  const refresh=()=>{
    const value=raw?.textContent??'',report=readPanelReport(value);
    if(value!==lastRaw){lastRaw=value;stopLookup();recallResults?.replaceChildren();
      if(recallQuery) recallQuery.value=(report?.product.brand??report?.product.title??'').slice(0,100);
      if(recallStatus) recallStatus.textContent=tr('Results are candidate notices; confirm exact model, serial and unit scope in the official notice.');
    }
    if(exportButton) exportButton.disabled=!report;if(recallButton) recallButton.disabled=!report||Boolean(lookup);
    applyFilters();
  };
  on('evidence-query','input',applyFilters);on('evidence-filter','change',applyFilters);
  on('export-report','click',()=>void(async()=>{
    const value=raw?.textContent??'',report=readPanelReport(value);if(!report) return;
    if(!await currentReportAllowed()||raw?.textContent!==value){if(status) status.textContent=tr('The page changed. Check this product again before exporting.');return;}
    const blob=new Blob([JSON.stringify(exportCurrentReport(report),null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='DropShredder-current-scan.json';
    doc.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    if(status) status.textContent=tr('Current-scan export prepared. Raw reviews, images, raw contact records and full page text are excluded.');
  })());
  on('recall-cancel','click',()=>{stopLookup();if(recallButton) recallButton.disabled=!readPanelReport(raw?.textContent??'');
    if(recallStatus) recallStatus.textContent=tr('Recall lookup canceled.');});
  on('recall-lookup','click',()=>{
    if(lookup) return;const value=raw?.textContent??'',report=readPanelReport(value);if(!report) return;
    const active=new AbortController();lookup=active;if(cancel) cancel.disabled=false;if(recallButton) recallButton.disabled=true;
    if(recallStatus) recallStatus.textContent=tr('Checking the query you chose with the public CPSC recall service…');
    // Begin synchronously so the helper reaches permissions.request during this user click.
    void lookupRecallCandidates(recallQuery?.value??'',(field?.value??'RecallTitle') as RecallField,report.product.mpn,active.signal)
      .then(result=>{
        if(lookup!==active || raw?.textContent!==value) return;
        recallResults?.replaceChildren();
        if(!result){if(recallStatus) recallStatus.textContent=tr('Chrome access was not granted. No recall request was sent.');return;}
        for(const item of result.candidates){
          const row=doc.createElement('article');row.className='evidence-row';
          const a=doc.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.title;
          const note=doc.createElement('p');note.textContent=tr('Notice $1 • $2 • $3',item.number,item.date??tr('date not supplied'),item.modelMentioned?tr('model token mentioned; unit scope unverified'):tr('retrieval candidate; product identity unverified'));
          row.append(a,note);recallResults?.append(row);
        }
        if(recallStatus) recallStatus.textContent=result.candidates.length
          ? tr('Candidate notices: $1; retrieved $2$3. Substring searches can include unrelated brands. Confirm each official notice; no result changes your score.',result.candidates.length,result.retrievedAt,result.truncated?tr(' — results capped'):'')
          : tr('No candidates returned for this query. The service and query can miss notices; this is not a safety clearance.');
      }).catch(error=>{if(lookup===active && raw?.textContent===value && recallStatus)
        recallStatus.textContent=active.signal.aborted?tr('Recall lookup canceled.'):error instanceof Error?errorText(error):tr('Recall lookup unavailable.');
      }).finally(()=>{if(lookup===active){lookup=undefined;if(cancel) cancel.disabled=true;if(recallButton) recallButton.disabled=!readPanelReport(raw?.textContent??'');}});
  });
  on('revoke-optional-access','click',()=>{stopLookup();if(recallButton) recallButton.disabled=!readPanelReport(raw?.textContent??'');
    if(recallStatus) recallStatus.textContent=tr('Recall lookup canceled while site access is removed.');});
  const observer=new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'||record.type==='characterData')) refresh();
  });
  if(raw) observer.observe(raw,{childList:true,subtree:true,characterData:true});
  if(list) observer.observe(list,{childList:true});
  refresh();
  return {refresh,dispose:()=>{stopLookup();observer.disconnect();listeners.forEach(remove=>remove());}};
}
