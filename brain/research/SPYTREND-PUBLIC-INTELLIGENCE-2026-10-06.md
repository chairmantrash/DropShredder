# SpyTrend public intelligence baseline — 2026-10-06

Scope: public-facing pages, Chrome Web Store metadata, free-tier disclosures, public blog/docs, and officially documented access only. No bypassing authentication, subscriptions, rate limits, or access controls.

## Why SpyTrend matters to DropShredder

SpyTrend is explicitly designed to help performance marketers and dropshippers find scaling stores, winning products, creatives, and operator networks. Its public documentation reveals which signals professional sellers currently use to identify what is working. Those same signals can be inverted defensively.

## Publicly documented capabilities

### Shopify/store intelligence
SpyTrend publicly describes a Shops database with millions of stores and fields such as:
- platform
- domain age
- category
- estimated visits and traffic growth
- active/total ads
- countries
- latest creatives
- number of products
- Shopify theme/apps
- product catalog and best sellers
- products seen in ads
- similar stores
- tracker IDs / pixels

Defensive implication:
- rapid catalog cloning and large multi-store reuse should be detectable longitudinally;
- same-product prevalence across many stores is a useful mass-resell clue, but not deception by itself;
- domain age vs seller age/origin claims remains valuable contradiction evidence.

### Product scaling signals
SpyTrend product cards expose concepts such as:
- days in advertising
- active vs total ads
- number of creatives
- number of shops currently advertising the same product
- status labels such as PROVEN / HEATING / JUST TESTING / RAN 30+

Defensive implication:
- a product simultaneously advertised by many unrelated stores is a strong indicator of commodity/resell saturation;
- ad longevity can identify persistent commodity funnels;
- these remain provenance/mass-resell signals, not automatic fraud evidence.

### Creative deduplication
SpyTrend publicly documents visual-match deduplication, including perceptual-hash-based grouping of reused ad creatives.

Defensive implication:
- DropShredder's local pHash/aHash/dHash roadmap is validated;
- repeated visuals across many advertisers/domains can become a mass-resell/network signal;
- chronology is still required before attributing who copied whom.

### Webmaster/operator grouping
SpyTrend says it groups activity using combinations of:
- tracking pixels
- domains
- fan/Page IDs
- IP/infrastructure
- tracking parameters/subcodes

Defensive implication:
- merchant graph should include public tracking IDs and stable campaign parameters;
- shared pixel/tracker values across storefronts can suggest common operation, but must not be treated as conclusive ownership;
- generic shared SaaS infrastructure must be excluded from identity inference.

### Tracking-parameter linkage
SpyTrend documents finding connected operators through repeated query-string/tracking parameter values.

Defensive implication:
- normalize campaign/tracking parameters seen in public landing URLs;
- record repeated uncommon values across domains;
- treat common platform defaults and affiliate-network-wide values as weak/non-unique unless combined with other evidence.

### Ads + traffic chronology
SpyTrend emphasizes:
- new ads per day
- creative survival
- traffic growth
- launch bursts
- revivals
- new creatives in a time window

Defensive implication:
- DropShredder can later use public ad-library chronology as external corroboration;
- sudden synchronized rollout of the same product/creative across multiple newly created stores is a useful network/mass-resell signal.

### Public/free access
SpyTrend publicly states:
- Starter plan is free with limited ad-database/basic-search access;
- Shops exposes initial rows and up to 10 store cards/day without payment;
- MCP trial access provides 500 lifetime tokens;
- official MCP/API access is authenticated and subject to account/plan limits.

Policy:
- use only the documented free/guest allowance if we ever connect directly;
- do not attempt to bypass quotas or locked sections.

## Defensive signals to add to DropShredder backlog

1. PRODUCT_MULTI_STORE_PREVALENCE
   - how many independently branded stores expose the same product fingerprint
   - moderate by itself; stronger with independent chronology/provenance evidence

2. CREATIVE_CROSS_DOMAIN_REUSE
   - same perceptual image/video fingerprint across unrelated storefront/ad domains
   - moderate by itself

3. UNCOMMON_TRACKER_REUSE
   - same uncommon pixel/tracker ID across multiple storefronts
   - merchant-network evidence
   - never infer ownership from generic shared SaaS IDs

4. CAMPAIGN_PARAMETER_REUSE
   - repeated uncommon tracking/subcode values across domains
   - merchant-network corroboration

5. SYNCHRONIZED_PRODUCT_LAUNCH
   - same product appears across multiple stores in a narrow time window
   - useful mass-resell signal

6. CLONED_CATALOG_PATTERN
   - large overlap in product titles/specifications/images plus near-synchronous launch chronology
   - stronger than one-image matches

7. AD_LONGEVITY_AND_REUSE
   - public ad-library creative repeatedly survives across time and domains
   - indicates scaled commodity/product funnel, not deception itself

8. DOMAIN_AGE_VS_STORE_CLAIMS
   - already partly implemented through RDAP contradiction checks

## False-positive controls

- Shared Meta/Google/TikTok pixels can belong to agencies, SaaS products, affiliates, or template defaults.
- Shared images can originate with a genuine maker whose photos were copied upstream.
- Product popularity across stores can reflect authorized wholesale distribution.
- Ad longevity does not prove profitability.
- Traffic estimates are not authoritative.
- Similar Shopify apps/themes have zero accusation weight.
- Infrastructure/IP co-location is weak when cloud/CDN/shared hosting is involved.

## Watch targets

Weekly intelligence should check:
- SpyTrend Shops feature changes
- public store/product field changes
- new tracker/network-resolution methods
- changes to free-tier/MCP capabilities
- new public ad/creative deduplication methods
- new dropshipper workflows described in their blog
- newly documented public identifiers that can be converted into defensive signals

## Sources
- https://spytrend.com/
- https://spytrend.com/pricing/
- https://spytrend.com/mcp/
- https://spytrend.com/blog/spytrend-shops
- https://spytrend.com/blog/spytrend-creatives
- https://spytrend.com/blog/spytrend-webmasters
- https://spytrend.com/blog/spytrend-dashboard-ads
- https://spytrend.com/blog/spytrend-mcp-ai-research
- https://chromewebstore.google.com/detail/store-spy-%E2%80%94-shopify-ads-i/jalaageombadhogjdjijldkilbehdkhc
