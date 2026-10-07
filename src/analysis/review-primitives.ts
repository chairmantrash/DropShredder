export const REVIEW_MISMATCH_TERMS=[
  'necklace','bracelet','earrings','handbag','purse','phone case','shirt','shoes',
  'lamp','charger','vacuum','blender','dress','jacket','ring','watch',
] as const;

export const REVIEW_INCENTIVE_PATTERNS=[
  /free\s+(?:product|item|sample)/i,
  /received\s+(?:this|the\s+product)\s+(?:for\s+free|at\s+a\s+discount)/i,
  /discount\s+(?:code|in\s+exchange)/i,
  /in\s+exchange\s+for\s+(?:my\s+)?(?:honest\s+)?review/i,
] as const;

export function normalizeReviewText(text:string):string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

export function reviewTokenSet(text:string):Set<string> {
  return new Set(normalizeReviewText(text).split(' ').filter(token=>token.length>=4));
}

export function reviewTextSimilarity(a:string,b:string):number {
  const left=reviewTokenSet(a),right=reviewTokenSet(b);
  if(left.size<4||right.size<4) return 0;
  let intersection=0;
  for(const token of left) if(right.has(token)) intersection++;
  return intersection/(left.size+right.size-intersection);
}

export function reviewMentionsMismatchedCategory(productTitle:string|undefined,text:string):string|undefined {
  const title=normalizeReviewText(productTitle??'');
  if(!title) return undefined;
  const normalized=normalizeReviewText(text);
  return REVIEW_MISMATCH_TERMS.find(term=>!title.includes(term)&&normalized.includes(term));
}

export function reviewHasIncentiveLanguage(text:string):boolean {
  return REVIEW_INCENTIVE_PATTERNS.some(pattern=>pattern.test(text));
}
