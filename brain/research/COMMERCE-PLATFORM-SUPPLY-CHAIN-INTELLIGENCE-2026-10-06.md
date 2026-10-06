# Commerce platform and supply-chain intelligence — 2026-10-06

Purpose: ship DropShredder with useful intelligence on day one. Local client history is supplemental, not required for basic platform/source/origin detection.

## Platform principle

Commerce platforms are zero-weight context. Many legitimate merchants use them. Platform detection should choose deeper probes, not create guilt.

### Built-in platform families
- Shopify
- WooCommerce
- BigCommerce
- Magento / Adobe Commerce
- SHOPLINE
- Shoplazza
- ShopBase / PlusBase / PrintBase ecosystem
- Wix Stores
- Ecwid
- Squarespace Commerce
- PrestaShop
- OpenCart
- Shift4Shop / 3dcart
- Salesforce Commerce Cloud

## Dropship/supplier context confirmed from public platform documentation

### Ecwid
Ecwid documents dropshipping integrations including Alibaba, Syncee, Printful and Wholesale2B. Supplier ships directly to the buyer.

Source:
https://support.ecwid.com/hc/en-us/articles/115005463865-Dropshipping-and-Ecwid

### Wix / Modalyst
Wix documents direct Modalyst integration, ready-to-sell product import, supplier-controlled shipping, price rules and automatic supplier fulfillment. It also documents AliExpress catalog access through Modalyst.

Sources:
https://support.wix.com/en/article/wix-stores-understanding-dropshipping
https://support.wix.com/en/article/wix-stores-setting-up-dropshipping-with-modalyst
https://support.wix.com/en/article/third-party-app-modalyst-dropshipping-by-modalyst

### Squarespace / Printful
Squarespace documents Printful as a print-on-demand drop-shipping integration where Printful prints, packs and ships goods.

Source:
https://support.squarespace.com/hc/en-us/articles/9052125217293-Sell-custom-merchandise-through-Printful

### ShopBase
ShopBase describes itself as a cross-border platform for dropshipping, print-on-demand and white-label merchants. Its docs describe AliExpress import, automated fulfillment, PlusBase, PrintBase, built-in payment gateways and supplier fulfillment.

Sources:
https://help.shopbase.com/en/article/introduction-to-shopbase-1xlxc9c
https://help.shopbase.com/en/article/how-to-build-a-dropshipping-website-with-shopbase-wn8kyb
https://help.shopbase.com/en/article/how-to-fulfill-a-dropshipping-order-1fwhnlq/

### Shift4Shop
Shift4Shop explicitly supports supplier-direct fulfillment, automatic supplier forwarding, AliExpress/Doba integrations and branded packing slips/invoices that can make supplier-direct shipping invisible to the buyer.

Sources:
https://www.shift4shop.com/dropshipping.html
https://www.shift4shop.com/lp/features/3dcarts-drop-shipping-features/
https://www.shift4shop.com/switch/dropshipping.html

## Built-in product/source registry

DropShredder should ship with source-search pivots for:
- AliExpress
- Alibaba
- 1688
- Temu
- DHgate
- Banggood
- Taobao
- Tmall
- Made-in-China.com
- Global Sources
- LightInTheBox
- SHEIN
- Amazon
- eBay
- Walmart
- CJdropshipping
- Zendrop
- Spocket
- Doba
- SaleHoo
- Wholesale2B
- Modalyst
- Syncee
- AutoDS
- Inventory Source
- Dropified
- DSers
- Printify
- Printful
- Gelato
- Tapstitch

Client history adds chronology, exact fingerprint reuse and observed-source relationships but does not define the initial registry.

## Supply-chain origin profile

Track separate nodes:
1. merchant/legal entity
2. manufacturing claim
3. fulfillment origin
4. return destination
5. payment processor/rail
6. payment/banking jurisdiction when actually verifiable

Do not infer bank jurisdiction from Stripe/PayPal/Adyen presence alone.

Labels:
- U.S. manufacture claimed
- mixed U.S. / international
- predominantly international
- known commerce chain entirely international
- unknown

For U.S.-origin preference:
- FTC unqualified Made in USA means all or virtually all U.S.-made.
- U.S. address or U.S. warehouse does not establish U.S. manufacture.
- "Assembled in USA" and "Ships from USA" are not equivalent to Made in USA.

Sources:
https://www.ftc.gov/business-guidance/resources/complying-made-usa-standard
https://www.ftc.gov/made-in-usa-rule

## Banking/payment guardrail

Payment processor presence indicates checkout infrastructure only.
Merchant/payee legal jurisdiction can be surfaced when disclosed.
Bank/acquirer jurisdiction remains UNKNOWN unless an actual public or transaction-level fact supports it.

Never label a payment chain domestic merely because checkout is in USD, uses a U.S.-familiar processor, or has a U.S. statement descriptor brand name.
