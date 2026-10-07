import type { InsertOpportunity } from "@workspace/db";
import { getCompanyTier, computeRankScore } from "../company-tiers";
import { logger } from "../logger";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  salary?: string;
  publication_date: string;
  tags?: string[];
  job_type?: string;
  description?: string;
}

const REQUEST_TIMEOUT_MS = 15_000;
const INTERN_KEYWORDS = ["intern", "internship", "junior", "entry", "graduate", "fresher"];

function isInternOrJunior(title: string, jobType?: string): boolean {
  const lower = title.toLowerCase();
  const typeLower = (jobType ?? "").toLowerCase();
  return INTERN_KEYWORDS.some((kw) => lower.includes(kw) || typeLower.includes(kw));
}

export async function fetchRemotive(): Promise<InsertOpportunity[]> {
  logger.info("[Remotive] Fetching remote internships...");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      "https://remotive.com/api/remote-jobs?category=software-dev&limit=100",
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (!res.ok) {
      logger.warn({ status: res.status }, "[Remotive] Non-OK response");
      return [];
    }
    const data = (await res.json()) as { jobs?: RemotiveJob[] };
    const jobs = (data.jobs ?? []).filter((j) => isInternOrJunior(j.title, j.job_type));
    const today = new Date().toISOString().slice(0, 10);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const result: InsertOpportunity[] = [];
    for (const job of jobs) {
      const publishedAt = job.publication_date ? job.publication_date.slice(0, 10) : today;
      if (new Date(publishedAt) < cutoff) continue; // already older than 30 days

      const tier = getCompanyTier(job.company_name);
      result.push({
        company: job.company_name,
        role: job.title,
        location: job.candidate_required_location || "Remote",
        mode: "Remote",
        stipend: job.salary ?? "See listing",
        stipendMin: null,
        eligibility: "See official listing for requirements.",
        skills: (job.tags ?? []).slice(0, 6),
        deadline: "See listing",
        applyUrl: job.url,
        source: "Remotive",
        sourceUrl: "https://remotive.com",
        hrEmail: null,
        recruiterLinkedin: null,
        fitScore: 68,
        salaryScore: 65,
        growthScore: 70,
        brandScore: tier === 1 ? 95 : tier === 2 ? 80 : 60,
        learningScore: 72,
        verified: true,
        saved: false,
        lastChecked: today,
        note: "Fetched from Remotive public remote jobs API.",
        publishedAt,
        firstSeenAt: today,
        lastSeenAt: today,
        isActive: true,
        companyTier: tier,
        rankScore: computeRankScore({ companyTier: tier, fitScore: 68, publishedAt }),
        sourceJobId: String(job.id),
        externalSource: "remotive",
      });
    }
    logger.info({ count: result.length }, "[Remotive] Fetched internships");
    return result;
  } catch (err: unknown) {
    clearTimeout(timer);
    if ((err as Error).name !== "AbortError") {
      logger.error({ err }, "[Remotive] Failed");
    } else {
      logger.warn("[Remotive] Request timed out");
    }
    return [];
  }
}
