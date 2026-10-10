import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';
import { COMMERCE_PLATFORMS } from '../src/intelligence/commerce-platforms';
import { SOURCE_INDEX } from '../src/intelligence/source-index';
import { MERCHANT_NETWORKS } from '../src/intelligence/merchant-networks';

function assertUnique(values:string[],label:string):void{
  assert.equal(new Set(values).size,values.length,`duplicate ${label}`);
}

test('commerce platform registry has unique IDs and auditable sources',()=>{
  assertUnique(COMMERCE_PLATFORMS.map(x=>x.id),'commerce platform id');
  for(const platform of COMMERCE_PLATFORMS){
    assert.match(platform.sourceUrl,/^https:\/\//);
    assert.ok(platform.name.trim().length>1);
    assert.ok(platform.dropshipContext.trim().length>10);
  }
});

test('source registry is unique and queryable out of the box',()=>{
  assertUnique(SOURCE_INDEX.map(x=>x.id),'source index id');
  for(const source of SOURCE_INDEX){
    assert.ok(source.domains.length>=1);
    assert.ok(source.queryDomains.length>=1);
    assertUnique(source.domains,`domains for ${source.id}`);
    assertUnique(source.queryDomains,`query domains for ${source.id}`);
  }
});

test('merchant networks carry freshness and source provenance',()=>{
  assertUnique(MERCHANT_NETWORKS.map(x=>x.id),'merchant network id');
  for(const network of MERCHANT_NETWORKS){
    assert.ok(network.domains.length>=1,`no domains for ${network.id}`);
    assertUnique(network.domains,`domains for ${network.id}`);
    assert.ok(Number.isFinite(Date.parse(network.reviewedAt+'T00:00:00Z')),`bad reviewedAt for ${network.id}`);
    assert.ok(network.freshnessDays>=30 && network.freshnessDays<=365,`bad freshness window for ${network.id}`);
    assert.ok(network.sources.length>=1,`no sources for ${network.id}`);
    for(const source of [...network.sources,...(network.consumerRiskSources ?? [])]){
      assert.match(source,/^https:\/\//,`non-HTTPS source in ${network.id}`);
    }
  }
});

test('maintenance manifest covers every shipped intelligence family',async()=>{
  const manifest=JSON.parse(await fs.readFile('intelligence/REGISTRY-MAINTENANCE.json','utf8')) as {
    registries:Array<{id:string;path:string}>
  };
  const paths=new Set(manifest.registries.map(x=>x.path));
  for(const required of [
    'src/intelligence/commerce-platforms.ts',
    'src/intelligence/source-index.ts',
    'src/intelligence/merchant-networks.ts',
    'intelligence/technology-signatures.json',
    'src/intelligence/tool-signatures.ts',
    'src/reputation/reputation-search.ts',
    'src/analysis/amazon-clone-clusters.ts',
    'tests/',
  ]){
    assert.equal(paths.has(required),true,`maintenance manifest missing ${required}`);
  }
});
