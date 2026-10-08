import assert from 'node:assert/strict';
import test from 'node:test';
import {classifyShoppingPage,type ShoppingPageFacts} from '../src/detection/shopping-page';

const product=(url:string):ShoppingPageFacts=>({
  url,title:'Canvas walking shoes',structuredProduct:true,structuredOffer:true,
  purchaseAction:true,visiblePrice:true,productDetail:true,productCards:2,
});

test('real product listing patterns qualify across common storefronts',()=>{
  const urls=[
    'https://www.apple.com/iphone-17/',
    'https://shop.example/products/canvas-shoes',
    'https://shop.example/product/red-boots',
    'https://www.amazon.com/dp/B0ABC12345',
    'https://www.etsy.com/listing/123456789/handmade-mug',
    'https://www.walmart.com/ip/canvas-walking-shoes/123456789',
    'https://shopline.example/products/blue-coat',
    'https://shoplazza.example/products/blue-coat',
    'https://shopbase.example/products/blue-coat',
    'https://wix.example/product-page/canvas-shoe',
    'https://squarespace.example/shop/p/canvas-shoe',
  ];
  for(const url of urls){
    const classified=classifyShoppingPage(product(url));
    assert.equal(classified.kind,'product',url);
    assert.equal(classified.showToast,true,url);
    assert.equal(classified.confidence,'high',url);
  }
});

test('ignore listing grids, search results, store homepages, and ordinary browsing',()=>{
  const urls=[
    'https://www.amazon.com/s?k=shoes',
    'https://www.etsy.com/search?q=shoes',
    'https://www.walmart.com/search?q=shoes',
    'https://shop.example/collections/new',
    'https://shop.example/categories/shoes',
    'https://shop.example/shop',
    'https://shop.example/',
    'https://google.com/search?q=boots',
    'https://youtube.com/watch?v=123',
    'https://reddit.com/r/shopping/',
    'https://mail.example/inbox',
  ];
  for(const url of urls){
    const classified=classifyShoppingPage({...product(url),structuredProduct:false,structuredOffer:false,purchaseAction:false});
    assert.equal(classified.showToast,false,url);
  }
});

test('product structured data, price, or commerce platform alone never triggers',()=>{
  const url='https://news.example/articles/shopping-trends';
  const combinations:Partial<ShoppingPageFacts>[]=[
    {structuredProduct:true},
    {ogProduct:true},
    {visiblePrice:true},
    {purchaseAction:true},
    {structuredProduct:true,structuredOffer:true},
    {structuredProduct:true,productDetail:true,title:'Recommended headphones'},
    {purchaseAction:true,visiblePrice:true,productDetail:false},
    {structuredArticle:true,structuredProduct:true},
  ];
  for(const bits of combinations){
    const classified=classifyShoppingPage({url,...bits});
    assert.equal(classified.showToast,false,JSON.stringify(bits));
  }
});

test('block all sensitive paths and embedded credential/payment fields',()=>{
  const paths=[
    '/checkout','/checkouts/123','/account','/orders',
    '/login','/billing','/payment','/wallet','/address-book',
  ];
  for(const path of paths){
    const classified=classifyShoppingPage(product('https://shop.example'+path));
    assert.equal(classified.kind,'sensitive',path);
  }
  assert.equal(classifyShoppingPage({...product('https://shop.example/products/watch'),hasSensitiveFields:true}).kind,'sensitive');
});

test('insufficient independent evidence must abstain',()=>{
  const details=classifyShoppingPage({
    url:'https://store.example/promo',
    title:'Today at the store',
    productDetail:true,
    visiblePrice:true,
    productCards:25,
  });
  assert.equal(details.showToast,false);
  const weak=classifyShoppingPage({
    url:'https://store.example/products/boot',
    title:'Boot',
    purchaseAction:true,
    productDetail:true,
    productCards:2,
  });
  assert.equal(weak.showToast,false,'A price or offer must be visible before fast verdict.');
});

test('artificial schema markup on articles cannot force a shopping toast',()=>{
  const classified=classifyShoppingPage({
    ...product('https://news.example/blog/review-of-shoes'),
    structuredArticle:true,
  });
  assert.equal(classified.showToast,false);
});
