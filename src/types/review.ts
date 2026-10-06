export interface ReviewSnapshot {
  id?: string;
  platform?: string;
  rating?: number;
  title?: string;
  body: string;
  date?: string;
  verified?: boolean;
  helpfulCount?: number;
  reviewerName?: string;
}

export interface ReviewAnalysisInput {
  reviews: ReviewSnapshot[];
  listingCreatedAt?: string;
  productTitle?: string;
}
