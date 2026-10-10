import { tr, errorText } from '../i18n/index';
import { readLocalLabel } from '../forensics/local-label-reader';
import { productSearchUrls } from '../deep-hunt/search-urls';
import { showSearchChooser } from './search-chooser';

export function mountLocalLabelControls(doc:Document=document):void{
  const input=doc.getElementById('label-image') as HTMLInputElement|null;
  const button=doc.getElementById('label-read') as HTMLButtonElement|null;
  const status=doc.getElementById('label-status');
  const output=doc.getElementById('label-results');
  let reading:AbortController|undefined;
  if(!input||!button||!status||!output)return;
  input.addEventListener('change',()=>{reading?.abort();reading=undefined;output.replaceChildren();status.textContent=tr('No file processed until you select READ LABEL ON DEVICE.');button.disabled=false;});
  button.addEventListener('click',()=>{
    if(reading)return;
    const file=input.files?.[0];
    if(!file){status.textContent=tr('Choose a product-label image first.');return;}
    const controller=new AbortController();reading=controller;button.disabled=true;
    status.textContent=tr('Reading image locally. No image is sent to a server.');
    output.replaceChildren();
    void readLocalLabel(file,controller.signal).then(result=>{
      if(reading!==controller)return;
      const summary=doc.createElement('p');
      summary.textContent=tr('Barcodes read: $1; text lines: $2. Barcode support: $3. OCR support: $4.',result.barcodes.length,result.textLines.length,result.barcodeAvailable?tr('available'):tr('unavailable'),result.textAvailable?tr('available'):tr('unavailable in this Chrome build'));
      output.append(summary);
      if(!result.barcodes.length&&!result.textLines.length){const empty=doc.createElement('p');empty.textContent=tr('No readable characters were found. Try a sharper label image or search manually.');output.append(empty);}
      for(const code of result.barcodes.slice(0,16)){
        const row=doc.createElement('p');row.textContent=tr('Barcode: $1',code);output.append(row);
      }
      for(const line of result.textLines.slice(0,30)){
        const row=doc.createElement('p');row.textContent=tr('Recognized text (unverified): $1',line);output.append(row);
      }
      if(result.gtins.length){
        const p=doc.createElement('p');p.textContent=tr('Checksum-valid barcode values (not independently verified): $1',result.gtins.join(', '));output.append(p);
      }
      const query=result.gtins[0]||result.textLines.find(t=>t.length>=10);
      if(query){
        const hunt=doc.createElement('button');hunt.className='secondary';hunt.textContent=tr('Search sources for this text');
        hunt.addEventListener('click',()=>showSearchChooser(productSearchUrls(query),doc));
        output.append(hunt);
      }
      status.textContent=tr('Local analysis complete. OCR/GTIN recognition may contain errors and never changes seller scores.');
    }).catch(e=>{if(reading===controller)status.textContent=controller.signal.aborted?tr('Canceled.'):e instanceof Error?errorText(e):tr('Local reader unavailable.');})
    .finally(()=>{if(reading===controller){reading=undefined;button.disabled=false;}});
  });
}
