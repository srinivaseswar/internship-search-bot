/**
 * Configurable company reputation tier system.
 * Tier 1 = elite, Tier 2 = reputed, Tier 3 = standard.
 * Add companies here to give them priority in ranking.
 */

export const TIER_1_COMPANIES: string[] = [
  "Google", "Microsoft", "Amazon", "Apple", "Meta", "NVIDIA", "Netflix",
  "Adobe", "Salesforce", "Intel", "Qualcomm", "JPMorgan Chase", "Goldman Sachs",
  "Morgan Stanley", "Samsung",
];

export const TIER_2_COMPANIES: string[] = [
  "IBM", "Cisco", "Oracle", "Accenture", "Deloitte", "EY", "PwC",
  "TCS", "Infosys", "Wipro", "Zoho", "Freshworks", "Walmart Global Tech",
  "Atlassian", "Razorpay", "PhonePe", "Zomato", "Swiggy", "Flipkart",
  "Byju's", "DRDO", "Digital India Corporation", "Coinbase", "Stripe",
  "Notion", "Airbnb", "Shopify", "Dropbox", "Spotify",
];

/**
 * Returns 1 for elite companies, 2 for reputed companies, 3 for all others.
 * Case-insensitive matching.
 */
export function getCompanyTier(company: string): 1 | 2 | 3 {
  const lower = company.toLowerCase();
  if (TIER_1_COMPANIES.some((c) => lower.includes(c.toLowerCase()))) return 1;
  if (TIER_2_COMPANIES.some((c) => lower.includes(c.toLowerCase()))) return 2;
  return 3;
}

/**
 * Compute a rank score for an opportunity.
 * Higher = better rank in listings.
 */
export function computeRankScore(opts: {
  companyTier: 1 | 2 | 3;
  fitScore: number;
  publishedAt: string | null | undefined;
}): number {
  const tierBonus = opts.companyTier === 1 ? 40 : opts.companyTier === 2 ? 20 : 0;

  // freshness: 30 pts for today, decays to 0 at 30 days
  let freshnessPts = 0;
  if (opts.publishedAt) {
    const daysOld = Math.max(
      0,
      (Date.now() - new Date(opts.publishedAt).getTime()) / 86400000,
    );
    freshnessPts = Math.max(0, Math.round(30 - daysOld));
  }

  return tierBonus + freshnessPts + Math.round(opts.fitScore * 0.3);
}
