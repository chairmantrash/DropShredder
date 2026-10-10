/** Self-contained for Chrome serialization; reads field types/form destinations, never values. */
export function hasSensitiveCommerceSurface(privateFormParts:string[],doc:Document=document):boolean {
  if(doc.querySelector([
    'input[type="password"]','input[autocomplete="cc-number"]','input[autocomplete="cc-csc"]',
    'input[autocomplete="current-password"]','input[autocomplete="new-password"]',
    'input[name*="cardnumber" i]','form[action*="checkout" i]','form[action*="payment" i]',
  ].join(','))) return true;
  const forms=doc.getElementsByTagName('form');
  for(let i=0;i<Math.min(forms.length,30);i++){
    const action=forms.item(i)?.getAttribute('action');
    if(!action) continue;
    try{
      const url=new URL(action,doc.baseURI);
      const parts=decodeURIComponent(url.pathname).normalize('NFKC').toLowerCase().split('/');
      if(parts.some(part=>privateFormParts.includes(part))) return true;
    }catch{}
  }
  return false;
}
