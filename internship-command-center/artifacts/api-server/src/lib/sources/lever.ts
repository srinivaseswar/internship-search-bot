import type { InsertOpportunity } from "@workspace/db";
import { getCompanyTier, computeRankScore } from "../company-tiers";
import { logger } from "../logger";

const LEVER_COMPANIES: Array<{ slug: string; displayName: string }> = [
  { slug: "netflix", displayName: "Netflix" },
  { slug: "plaid", displayName: "Plaid" },
  { slug: "reddit", displayName: "Reddit" },
  { slug: "discord", displayName: "Discord" },
  { slug: "linear", displayName: "Linear" },
  { slug: "scale", displayName: "Scale AI" },
  { slug: "benchling", displayName: "Benchling" },
  { slug: "verkada", displayName: "Verkada" },
];

interface LeverPosting {
  id: string;
  text: string;
  createdAt?: number;
  categories?: { location?: string; team?: string; commitment?: string };
  hostedUrl?: string;
}

const REQUEST_TIMEOUT_MS = 10_000;
const INTERN_KEYWORDS = ["intern", "internship", "co-op", "coop"];

function isInternship(title: string, commitment?: string): boolean {
  const lower = title.toLowerCase();
  const commitLower = (commitment ?? "").toLowerCase();
  return INTERN_KEYWORDS.some((kw) => lower.includes(kw) || commitLower.includes(kw));
}

async function fetchCompany(slug: string, displayName: string): Promise<InsertOpportunity[]> {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = (await res.json()) as LeverPosting[];
    const jobs = (Array.isArray(data) ? data : []).filter((j) =>
      isInternship(j.text, j.categories?.commitment),
    );
    const today = new Date().toISOString().slice(0, 10);
    const tier = getCompanyTier(displayName);

    return jobs.map((job) => {
      const publishedAt = job.createdAt
        ? new Date(job.createdAt).toISOString().slice(0, 10)
        : today;
      return {
        company: displayName,
        role: job.text,
        location: job.categories?.location ?? "See listing",
        mode: "Hybrid",
        stipend: "See listing",
        stipendMin: null,
        eligibility: "See official listing for requirements.",
        skills: [],
        deadline: "See listing",
        applyUrl: job.hostedUrl ?? `https://jobs.lever.co/${slug}/${job.id}`,
        source: "Lever",
        sourceUrl: `https://jobs.lever.co/${slug}`,
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
        note: `Fetched from Lever public job board for ${displayName}.`,
        publishedAt,
        firstSeenAt: today,
        lastSeenAt: today,
        isActive: true,
        companyTier: tier,
        rankScore: computeRankScore({ companyTier: tier, fitScore: 70, publishedAt }),
        sourceJobId: job.id,
        externalSource: "lever",
      } satisfies InsertOpportunity;
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if ((err as Error).name !== "AbortError") {
      logger.warn({ err, slug }, "[Lever] Request failed");
    }
    return [];
  }
}

export async function fetchLever(): Promise<InsertOpportunity[]> {
  logger.info("[Lever] Fetching internships...");
  const results = await Promise.allSettled(
    LEVER_COMPANIES.map((c) => fetchCompany(c.slug, c.displayName)),
  );
  const all: InsertOpportunity[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  logger.info({ count: all.length }, "[Lever] Fetched internships");
  return all;
}
