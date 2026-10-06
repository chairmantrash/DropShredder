import assert from 'node:assert/strict';
import { SOURCE_INDEX } from '../src/intelligence/source-index';
import { MERCHANT_NETWORKS } from '../src/intelligence/merchant-networks';
import { COMMERCE_PLATFORMS } from '../src/intelligence/commerce-platforms';
import { validateRegistry, type SignatureRegistry } from '../src/intelligence/signature-registry';
import fs from 'node:fs';

const errors:string[]=[];
const today='2026-10-06';

function unique<T>(values:T[],label:string):void{
  const seen=new Set<T>();
  for(const value of values){
    if(seen.has(value)) errors.push(`Duplicate ${label}: ${String(value)}`);
    seen.add(value);
  }
}

function validDate(value:string):boolean{
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value+'T00:00:00Z'));
}

unique(SOURCE_INDEX.map(x=>x.id),'source id');
const sourceDomains=SOURCE_INDEX.flatMap(source=>source.domains.map(domain=>({domain:domain.toLowerCase(),id:source.id})));
unique(sourceDomains.map(x=>x.domain),'source domain');
for(const source of SOURCE_INDEX){
  if(!source.domains.length) errors.push(`Source ${source.id} has no domains`);
  if(!source.queryDomains.length) errors.push(`Source ${source.id} has no queryDomains`);
  if(!source.notes.trim()) errors.push(`Source ${source.id} has no notes`);
}

unique(COMMERCE_PLATFORMS.map(x=>x.id),'commerce platform id');
for(const platform of COMMERCE_PLATFORMS){
  if(!platform.sourceUrl.startsWith('https://')) errors.push(`Platform ${platform.id} missing HTTPS provenance URL`);
  const signatures=[
    ...(platform.scriptIncludes??[]),
    ...(platform.htmlIncludes??[]),
    ...(platform.selectors??[]),
    ...(platform.imageHostIncludes??[]),
  ];
  if(!signatures.length) errors.push(`Platform ${platform.id} has no observable signatures`);
}

unique(MERCHANT_NETWORKS.map(x=>x.id),'merchant network id');
const activeDomainOwner=new Map<string,string>();
for(const network of MERCHANT_NETWORKS){
  if(!validDate(network.reviewedAt)) errors.push(`Network ${network.id} has invalid reviewedAt`);
  if(validDate(network.reviewedAt) && network.reviewedAt>today) errors.push(`Network ${network.id} reviewedAt is in the future`);
  if(network.freshnessDays<14 || network.freshnessDays>365) errors.push(`Network ${network.id} freshnessDays out of bounds`);
  if(network.status!=='retired' && network.sources.length<1) errors.push(`Network ${network.id} has no ownership/linkage sources`);
  for(const url of [...network.sources,...(network.consumerRiskSources??[])]){
    if(!url.startsWith('https://')) errors.push(`Network ${network.id} has non-HTTPS source: ${url}`);
  }
  for(const domainRaw of network.domains){
    const domain=domainRaw.toLowerCase();
    if(!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) errors.push(`Network ${network.id} has invalid domain: ${domainRaw}`);
    if(network.status==='retired') continue;
    const existing=activeDomainOwner.get(domain);
    if(existing && existing!==network.id) errors.push(`Active domain ${domain} appears in both ${existing} and ${network.id}`);
    activeDomainOwner.set(domain,network.id);
  }
}

const raw=JSON.parse(fs.readFileSync('intelligence/technology-signatures.json','utf8')) as SignatureRegistry;
errors.push(...validateRegistry(raw));

const maintenance=JSON.parse(fs.readFileSync('intelligence/REGISTRY-MAINTENANCE.json','utf8')) as {
  registries:Array<{id:string;path:string;checks:string[]}>;
};
unique(maintenance.registries.map(r=>r.id),'maintenance registry id');
for(const registry of maintenance.registries){
  if(!registry.checks.length) errors.push(`Maintenance registry ${registry.id} has no checks`);
  if(!fs.existsSync(registry.path)) errors.push(`Maintenance registry ${registry.id} points to missing path ${registry.path}`);
}

if(errors.length){
  console.error('DropShredder data lint failed:\n'+errors.map(x=>' - '+x).join('\n'));
  process.exit(1);
}
assert.ok(SOURCE_INDEX.length>=20,'Built-in source index unexpectedly small');
assert.ok(COMMERCE_PLATFORMS.length>=10,'Commerce platform registry unexpectedly small');
assert.ok(MERCHANT_NETWORKS.length>=10,'Merchant network corpus unexpectedly small');
console.log(`Data lint passed: ${SOURCE_INDEX.length} sources, ${COMMERCE_PLATFORMS.length} platforms, ${MERCHANT_NETWORKS.length} merchant networks, ${raw.signatures.length} technology signatures.`);
