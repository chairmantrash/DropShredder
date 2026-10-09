/** Explicit selection keeps every destination visible without an unbounded tab burst. */
export function showSearchChooser(urls:Record<string,string>,doc:Document=document):void{
  doc.querySelector('#ds-search-chooser')?.remove();
  const entries=Object.entries(urls).filter(([,url])=>{try{return new URL(url).protocol==='https:';}catch{return false;}}).slice(0,40);
  const dialog=doc.createElement('dialog');dialog.id='ds-search-chooser';
  const title=doc.createElement('h2');title.textContent='Choose searches to open';dialog.append(title);
  const note=doc.createElement('p');note.textContent='External searches share the query with the selected search engine. Open up to 8 at a time.';dialog.append(note);
  const choices=entries.map(([name,url],i)=>{
    const label=doc.createElement('label');label.style.display='block';
    const input=doc.createElement('input');input.type='checkbox';input.checked=i<8;
    const span=doc.createElement('span');span.textContent=` ${name.replace(/-/g,' ')} — ${new URL(url).hostname}`;
    label.append(input,span);dialog.append(label);return {input,url,opened:false};
  });
  const status=doc.createElement('p');status.setAttribute('role','status');dialog.append(status);
  const open=doc.createElement('button');open.textContent='Open selected searches';
  const close=doc.createElement('button');close.textContent='Close';close.addEventListener('click',()=>dialog.remove());
  open.addEventListener('click',()=>void(async()=>{
    const selected=choices.filter(c=>c.input.checked && !c.opened);
    if(!selected.length || selected.length>8){status.textContent='Choose between 1 and 8 searches.';return;}
    open.disabled=true;
    try{
      for(const c of selected){await chrome.tabs.create({url:c.url,active:false});c.opened=true;c.input.checked=false;c.input.disabled=true;}
      const remaining=choices.filter(c=>!c.opened);
      remaining.slice(0,8).forEach(c=>{c.input.checked=true;});
      status.textContent=`Opened ${selected.length} searches. ${remaining.length} remaining.`;
      if(!remaining.length) open.disabled=true;
    }catch{status.textContent='A search could not open. Unopened searches remain available.';}
    finally{open.disabled=choices.every(c=>c.opened);}
  })());
  dialog.append(open,close);doc.body.append(dialog);dialog.showModal();close.focus();
}
