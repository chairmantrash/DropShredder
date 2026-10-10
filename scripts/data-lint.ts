import fs from 'node:fs';
import { SOURCE_INDEX } from '../src/intelligence/source-index';
import { MERCHANT_NETWORKS, merchantNetworkIsFresh } from '../src/intelligence/merchant-networks';
import { COMMERCE_PLATFORMS } from '../src/intelligence/commerce-platforms';
import { validateRegistry, type SignatureRegistry } from '../src/intelligence/signature-registry';
import {validateRegionalDirectory} from '../src/intelligence/north-america-directory';

const errors:string[]=[];
const warnings:string[]=[];
if(!validateRegionalDirectory()) errors.push('Invalid North American directory or relationship provenance');

function unique(values:string[],label:string):void{
  const seen=new Set<string>();
  for(const value of values){
    if(seen.has(value)) errors.push(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}
function validDomain(domain:string):boolean{
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain);
}

unique(SOURCE_INDEX.map(item=>item.id),'source id');
for(const source of SOURCE_INDEX){
  if(!source.domains.length) errors.push(`Source ${source.id} has no domains`);
  if(!source.queryDomains.length) errors.push(`Source ${source.id} has no query domains`);
  unique(source.domains.map(x=>x.toLowerCase()),`domain in ${source.id}`);
  for(const domain of [...source.domains,...source.queryDomains]){
    if(!validDomain(domain)) errors.push(`Source ${source.id} has invalid domain ${domain}`);
  }
  if(!source.notes.trim()) errors.push(`Source ${source.id} has no notes`);
}

unique(COMMERCE_PLATFORMS.map(item=>item.id),'platform id');
for(const platform of COMMERCE_PLATFORMS){
  if(!platform.sourceUrl.startsWith('https://')) errors.push(`Platform ${platform.id} source must be HTTPS`);
  const signatures=[
    ...(platform.scriptIncludes ?? []),
    ...(platform.htmlIncludes ?? []),
    ...(platform.selectors ?? []),
    ...(platform.imageHostIncludes ?? []),
  ];
  if(!signatures.length) errors.push(`Platform ${platform.id} has no observable signatures`);
}

unique(MERCHANT_NETWORKS.map(item=>item.id),'merchant network id');
const domainOwner=new Map<string,string>();
for(const network of MERCHANT_NETWORKS){
  if(!Number.isFinite(Date.parse(network.reviewedAt+'T00:00:00Z'))) errors.push(`Network ${network.id} has invalid reviewedAt`);
  if(network.freshnessDays<30 || network.freshnessDays>365) errors.push(`Network ${network.id} has invalid freshnessDays`);
  if(network.status!=='retired' && !network.sources.length) errors.push(`Network ${network.id} has no linkage sources`);
  if(network.status==='active' && !merchantNetworkIsFresh(network)) errors.push(`Active network ${network.id} exceeded its freshness window`);
  if(network.status==='watch' && !merchantNetworkIsFresh(network)) warnings.push(`Watch network ${network.id} exceeded its freshness window`);
  for(const url of [...network.sources,...(network.consumerRiskSources ?? [])]){
    if(!url.startsWith('https://')) errors.push(`Network ${network.id} has non-HTTPS source ${url}`);
  }
  for(const raw of network.domains){
    const domain=raw.toLowerCase();
    if(!validDomain(domain)) errors.push(`Network ${network.id} has invalid domain ${raw}`);
    if(network.status==='retired') continue;
    const previous=domainOwner.get(domain);
    if(previous && previous!==network.id) errors.push(`Domain ${domain} belongs to both ${previous} and ${network.id}`);
    domainOwner.set(domain,network.id);
  }
}

const signatures=JSON.parse(fs.readFileSync('intelligence/technology-signatures.json','utf8')) as SignatureRegistry;
errors.push(...validateRegistry(signatures));

const apiRegistry=JSON.parse(fs.readFileSync('intelligence/public-api-registry.json','utf8')) as {
  version:number;
  updatedAt:string;
  policy:{paidApiDependenciesAllowed:boolean;freePublicApisAllowed:boolean;freeKeyApisAllowed:boolean;runtimeSecretsBundledInExtension:boolean;countryOrNationalityRiskWeight:number};
  sources:Array<{id:string;access:string;runtimeClass:string;status:string;purpose:string[];matchPolicy:string;primarySource:string}>;
};
if(apiRegistry.policy.paidApiDependenciesAllowed) errors.push('Public API registry must not allow paid API dependencies');
if(apiRegistry.policy.runtimeSecretsBundledInExtension) errors.push('Public API registry must not allow bundled runtime secrets');
if(apiRegistry.policy.countryOrNationalityRiskWeight!==0) errors.push('Country/nationality must have zero standalone risk weight');
if(!apiRegistry.policy.freePublicApisAllowed || !apiRegistry.policy.freeKeyApisAllowed) errors.push('Free public/free-key API policy unexpectedly disabled');
if(!Number.isFinite(Date.parse(apiRegistry.updatedAt+'T00:00:00Z'))) errors.push('Public API registry has invalid updatedAt');
unique(apiRegistry.sources.map(item=>item.id),'public API id');
for(const source of apiRegistry.sources){
  if(!source.primarySource.startsWith('https://')) errors.push(`Public API ${source.id} primary source must be HTTPS`);
  if(!source.purpose.length) errors.push(`Public API ${source.id} has no purpose`);
  if(!source.matchPolicy.trim()) errors.push(`Public API ${source.id} has no false-positive/match policy`);
  if(!source.access.trim() || !source.runtimeClass.trim() || !source.status.trim()) errors.push(`Public API ${source.id} has incomplete access metadata`);
}
if(apiRegistry.sources.length<8) errors.push('Public API registry unexpectedly small');
for(const source of apiRegistry.sources){
  if(/paid/i.test(source.access) && !/free/i.test(source.access)) errors.push(`Public API ${source.id} appears to require paid access`);
  if(/runtime/i.test(source.runtimeClass) && /key/i.test(source.access) && !/user|optional|build/i.test(source.runtimeClass+' '+source.access)){
    warnings.push(`Public API ${source.id} needs review to ensure no secret is bundled in the extension`);
  }
}

const maintenance=JSON.parse(fs.readFileSync('intelligence/REGISTRY-MAINTENANCE.json','utf8')) as {
  registries:Array<{id:string;path:string;checks:string[]}>
};
unique(maintenance.registries.map(item=>item.id),'maintenance id');
for(const item of maintenance.registries){
  if(!item.checks.length) errors.push(`Maintenance entry ${item.id} has no checks`);
  if(!fs.existsSync(item.path)) errors.push(`Maintenance entry ${item.id} points to missing ${item.path}`);
}

if(SOURCE_INDEX.length<25) errors.push('Built-in source registry unexpectedly small');
if(COMMERCE_PLATFORMS.length<12) errors.push('Built-in commerce-platform registry unexpectedly small');
if(MERCHANT_NETWORKS.length<12) errors.push('Built-in merchant-network registry unexpectedly small');
if(signatures.signatures.length<4) errors.push('Technology-signature registry unexpectedly small');

for(const warning of warnings) console.warn('WARNING:',warning);
if(errors.length){
  console.error('DropShredder data lint failed:\n'+errors.map(item=>' - '+item).join('\n'));
  process.exit(1);
}
console.log(`Data lint passed: ${SOURCE_INDEX.length} sources, ${COMMERCE_PLATFORMS.length} platforms, ${MERCHANT_NETWORKS.length} merchant networks, ${signatures.signatures.length} technology signatures, ${apiRegistry.sources.length} public APIs.`);
