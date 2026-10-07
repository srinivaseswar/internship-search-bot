import type { InsertOpportunity } from "@workspace/db";
import { getCompanyTier, computeRankScore } from "../company-tiers";
import { logger } from "../logger";

// Companies that use Greenhouse and have public job boards
const GREENHOUSE_COMPANIES: Array<{ slug: string; displayName: string }> = [
  { slug: "notion", displayName: "Notion" },
  { slug: "stripe", displayName: "Stripe" },
  { slug: "airbnb", displayName: "Airbnb" },
  { slug: "shopify", displayName: "Shopify" },
  { slug: "dropbox", displayName: "Dropbox" },
  { slug: "coinbase", displayName: "Coinbase" },
  { slug: "figma", displayName: "Figma" },
  { slug: "vercel", displayName: "Vercel" },
  { slug: "mongodb", displayName: "MongoDB" },
  { slug: "hubspot", displayName: "HubSpot" },
  { slug: "zendesk", displayName: "Zendesk" },
  { slug: "datadog", displayName: "Datadog" },
  { slug: "twilio", displayName: "Twilio" },
];

interface GhJob {
  id: number;
  title: string;
  updated_at?: string;
  location?: { name?: string };
  absolute_url?: string;
  departments?: Array<{ name: string }>;
}

const REQUEST_TIMEOUT_MS = 10_000;
const INTERN_KEYWORDS = ["intern", "internship", "co-op", "coop"];

function isInternship(title: string): boolean {
  const lower = title.toLowerCase();
  return INTERN_KEYWORDS.some((kw) => lower.includes(kw));
}

async function fetchCompany(slug: string, displayName: string): Promise<InsertOpportunity[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs?: GhJob[] };
    const jobs = (data.jobs ?? []).filter((j) => isInternship(j.title));
    const today = new Date().toISOString().slice(0, 10);
    const tier = getCompanyTier(displayName);

    return jobs.map((job) => {
      const publishedAt = job.updated_at ? job.updated_at.slice(0, 10) : today;
      return {
        company: displayName,
        role: job.title,
        location: job.location?.name ?? "See listing",
        mode: "Hybrid",
        stipend: "See listing",
        stipendMin: null,
        eligibility: "See official listing for requirements.",
        skills: [],
        deadline: "See listing",
        applyUrl: job.absolute_url ?? `https://boards.greenhouse.io/${slug}/jobs/${job.id}`,
        source: "Greenhouse",
        sourceUrl: `https://boards.greenhouse.io/${slug}`,
        hrEmail: null,
        recruiterLinkedin: null,
        fitScore: 70,
        salaryScore: 70,
        growthScore: 75,
        brandScore: tier === 1 ? 95 : tier === 2 ? 80 : 65,
        learningScore: 75,
        verified: true,
        saved: false,
        lastChecked: today,
        note: `Fetched from Greenhouse public job board for ${displayName}.`,
        publishedAt,
        firstSeenAt: today,
        lastSeenAt: today,
        isActive: true,
        companyTier: tier,
        rankScore: computeRankScore({ companyTier: tier, fitScore: 70, publishedAt }),
        sourceJobId: String(job.id),
        externalSource: "greenhouse",
      } satisfies InsertOpportunity;
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if ((err as Error).name !== "AbortError") {
      logger.warn({ err, slug }, "[Greenhouse] Request failed");
    }
    return [];
  }
}

export async function fetchGreenhouse(): Promise<InsertOpportunity[]> {
  logger.info("[Greenhouse] Fetching internships...");
  const results = await Promise.allSettled(
    GREENHOUSE_COMPANIES.map((c) => fetchCompany(c.slug, c.displayName)),
  );
  const all: InsertOpportunity[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  logger.info({ count: all.length }, "[Greenhouse] Fetched internships");
  return all;
}
