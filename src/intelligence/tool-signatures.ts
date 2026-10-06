export interface ToolSignatureMatch {
  id: string;
  family: 'reviews' | 'tracking' | 'scarcity' | 'platform';
  label: string;
  evidence: string;
  defaultWeight: 0;
}

export interface ToolSignature {
  id: string;
  family: ToolSignatureMatch['family'];
  label: string;
  scriptIncludes?: string[];
  selectors?: string[];
  globals?: string[];
}

/**
 * Tool presence is informational only.
 * Legitimate merchants use these products; callers must never turn a match
 * into a dropship/deception accusation without independent corroboration.
 */
export const TOOL_SIGNATURES: ToolSignature[] = [
  {
    id:'review-loox',
    family:'reviews',
    label:'Loox reviews',
    scriptIncludes:['loox.io/widget/loox.js'],
    selectors:['#looxReviews','.loox-rating'],
  },
  {
    id:'review-judgeme',
    family:'reviews',
    label:'Judge.me reviews',
    selectors:['#judgeme_product_reviews','.jdgm-widget','.jdgm-review-widget','.jdgm-preview-badge'],
  },
  {
    id:'tracking-track123',
    family:'tracking',
    label:'Track123 tracking',
    scriptIncludes:['track123.com/track123-widget.min.js','shp.track123.com/tracking-page/build/widget.min.js'],
    selectors:['#track123-tracking-widget','track123-tracking-widget'],
    globals:['track123WidgetConfig'],
  },
  {
    id:'tracking-parcelpanel',
    family:'tracking',
    label:'ParcelPanel/CWILL tracking',
    scriptIncludes:['pp-proxy.parcelpanel.com/assets/tracking/track-page.js','shopify-edd.parcelpanel.com/loader.js'],
    selectors:['#pp-tracking-page-app','parcelpanel-edd','#pp-tracking-shop'],
  },
];

export function detectToolSignatures(doc: Document = document, win: Window = window): ToolSignatureMatch[] {
  const scriptSources=[...doc.scripts].map(s=>s.src).filter(Boolean);
  const matches: ToolSignatureMatch[]=[];

  for(const signature of TOOL_SIGNATURES){
    let evidence:string|undefined;

    for(const needle of signature.scriptIncludes ?? []){
      const found=scriptSources.find(src=>src.includes(needle));
      if(found){ evidence=`script:${found}`; break; }
    }

    if(!evidence){
      for(const selector of signature.selectors ?? []){
        if(doc.querySelector(selector)){ evidence=`selector:${selector}`; break; }
      }
    }

    if(!evidence){
      for(const globalName of signature.globals ?? []){
        if(globalName in (win as unknown as Record<string, unknown>)){
          evidence=`global:${globalName}`; break;
        }
      }
    }

    if(evidence){
      matches.push({
        id:signature.id,
        family:signature.family,
        label:signature.label,
        evidence,
        defaultWeight:0,
      });
    }
  }
  return matches;
}
