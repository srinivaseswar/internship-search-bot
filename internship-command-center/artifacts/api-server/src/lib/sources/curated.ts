import type { InsertOpportunity } from "@workspace/db";
import { getCompanyTier, computeRankScore } from "../company-tiers";
import { starterOpportunities } from "../career-data";
import { logger } from "../logger";

/**
 * Curated source — returns the existing hardcoded seed data.
 * Sets publishedAt to today for freshness (since these are handpicked, ever-green listings).
 */
export async function fetchCurated(): Promise<InsertOpportunity[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    return starterOpportunities.map((opp) => {
      const tier = getCompanyTier(opp.company);
      return {
        ...opp,
        publishedAt: today,
        firstSeenAt: today,
        lastSeenAt: today,
        isActive: true,
        companyTier: tier,
        rankScore: computeRankScore({ companyTier: tier, fitScore: opp.fitScore, publishedAt: today }),
        externalSource: "curated",
        sourceJobId: null,
      };
    });
  } catch (err) {
    logger.error({ err }, "[Curated] Failed to load curated opportunities");
    return [];
  }
}
