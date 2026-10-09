import assert from 'node:assert/strict';
import test from 'node:test';
import {parseHTML} from 'linkedom';
import {attachMarketplaceBadges,marketplaceResultsKind,removeMarketplaceBadges} from '../src/ui/marketplace-badges';

test('marketplace badges are limited to actual search result pages, not browsing or checkout',()=>{
  assert.equal(marketplaceResultsKind('https://www.amazon.com/s?k=lamp'),'amazon');
  assert.equal(marketplaceResultsKind('https://www.etsy.com/search?q=hat'),'etsy');
  assert.equal(marketplaceResultsKind('https://www.walmart.com/search?q=books'),'walmart');
  for(const url of ['https://www.amazon.com/dp/B0ABC12345','https://www.etsy.com/checkout','https://www.walmart.com/account','https://news.example.com/search?q=lamp','http://www.amazon.com/s?k=test'])
    assert.equal(marketplaceResultsKind(url),undefined);
});

test('badges are inert, bounded, idempotent and only navigate to marketplace products',()=>{
  const {document}=parseHTML('<html><body><section data-component-type="s-search-result"><a href="https://www.amazon.com/dp/B0ABC12345?ref_=affiliate">Lamp</a></section><section data-component-type="s-search-result"><a href="https://evil.example.com/dp/B0ABC12345">Bad link</a></section><section data-component-type="s-search-result"><a href="https://www.amazon.com/gp/help">Help</a></section></body></html>');
  const url='https://www.amazon.com/s?k=lamp';
  assert.equal(attachMarketplaceBadges(document as unknown as Document,url),1);
  assert.equal(attachMarketplaceBadges(document as unknown as Document,url),0);
  const anchor=document.querySelector('[data-dropshredder-result-label]')!;
  assert.equal(anchor.getAttribute('href'),'https://www.amazon.com/dp/B0ABC12345');
  assert.equal(anchor.textContent,'🔎 Check with DropShredder');
  removeMarketplaceBadges(document as unknown as Document);
  assert.equal(document.querySelectorAll('[data-dropshredder-result-label]').length,0);
});

test('Etsy and Walmart require individual listing paths inside a product card',()=>{
  for(const [url,href] of [
    ['https://www.etsy.com/search?q=bag','https://www.etsy.com/listing/123456789/leather-bag?tracking=secret'],
    ['https://www.walmart.com/search?q=bag','https://www.walmart.com/ip/bag/12345678?athbdg=secret'],
  ]){
    const {document}=parseHTML('<html><body><article><a href="'+href+'">Product</a></article><nav><a href="'+href+'">Navigation</a></nav></body></html>');
    assert.equal(attachMarketplaceBadges(document as unknown as Document,url),1);
    const link=document.querySelector('[data-dropshredder-result-label]')!;
    assert.ok(!(link.getAttribute('href')??'').includes('secret'));
  }
});
