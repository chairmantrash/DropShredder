import { tr, localizeDocument } from '../../src/i18n/index';
import { showSearchChooser } from '../../src/ui/search-chooser';
localizeDocument();
const key=location.hash.slice(1);
void(async()=>{
  if(!/^ds-search-[a-f0-9-]{36}$/.test(key)) return;
  const stored=await chrome.storage.session.get(key);
  await chrome.storage.session.remove(key);
  const urls=stored[key];
  if(urls && typeof urls==='object' && !Array.isArray(urls) && Object.values(urls).every(v=>typeof v==='string')) showSearchChooser(urls);
  else document.querySelector('#status')!.textContent=tr('This search selection expired. Start another hunt.');
})();
