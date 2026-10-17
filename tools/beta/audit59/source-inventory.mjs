import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {parseHTML} from 'linkedom';
const [directory,output]=process.argv.slice(2);if(!directory||!output)throw Error('Usage: source-inventory.mjs DIRECTORY OUTPUT');
const raw=fs.readFileSync(path.join(directory,'source-receipts.json'),'utf8'),receipts=JSON.parse(raw),rows=[],quarantined=[];
const selectors={judgeme:'.jdgm-rev',woocommerce:'.woocommerce-review__text',loox:'.loox-review',yotpo:'.yotpo-review',bazaarvoice:'.bv-content-review',stamped:'.stamped-review'};
for(const r of receipts.filter(r=>r.status===200)){
 const b=fs.readFileSync(path.join(directory,r.id+'.html'));if(createHash('sha256').update(b).digest('hex')!==r.sha256){quarantined.push(r.id);continue;}
 const {document}=parseHTML(b.toString('utf8'));
 rows.push({id:r.id,host:r.host,sourceSha256:r.sha256,...Object.fromEntries(Object.entries(selectors).map(([k,v])=>[k,document.querySelectorAll(v).length]))});
}
fs.writeFileSync(output,JSON.stringify({scope:'Hash-verified static selector candidates only; widget presence is not visible/current-product review attribution or fake-review ground truth',receiptSha256:createHash('sha256').update(raw).digest('hex'),documents:rows.length,quarantined,totals:Object.fromEntries(Object.keys(selectors).map(k=>[k,{pages:rows.filter(r=>r[k]).length,rows:rows.reduce((a,r)=>a+r[k],0)}])),rows},null,2)+'\n');console.log(JSON.stringify({documents:rows.length,quarantined}));
