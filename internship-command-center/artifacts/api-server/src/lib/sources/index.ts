import type { InsertOpportunity } from "@workspace/db";
import { logger } from "../logger";
import { fetchGreenhouse } from "./greenhouse";
import { fetchLever } from "./lever";
import { fetchRemotive } from "./remotive";
import { fetchCurated } from "./curated";

export interface SourceResult {
  source: string;
  count: number;
  status: "success" | "failed";
  error?: string;
}

export interface CollectionResult {
  sources: SourceResult[];
  opportunities: InsertOpportunity[];
}

async function runSource(
  name: string,
  fn: () => Promise<InsertOpportunity[]>,
): Promise<{ result: SourceResult; opportunities: InsertOpportunity[] }> {
  try {
    const opportunities = await fn();
    return {
      result: { source: name, count: opportunities.length, status: "success" },
      opportunities,
    };
  } catch (err) {
    logger.error({ err, source: name }, `[Sources] ${name} failed`);
    return {
      result: { source: name, count: 0, status: "failed", error: String(err) },
      opportunities: [],
    };
  }
}

export async function collectAllSources(): Promise<CollectionResult> {
  logger.info("[Scheduler] Internship collection started");

  const [greenhouse, lever, remotive, curated] = await Promise.all([
    runSource("Greenhouse", fetchGreenhouse),
    runSource("Lever", fetchLever),
    runSource("Remotive", fetchRemotive),
    runSource("Curated", fetchCurated),
  ]);

  const sources = [greenhouse.result, lever.result, remotive.result, curated.result];
  const opportunities = [
    ...greenhouse.opportunities,
    ...lever.opportunities,
    ...remotive.opportunities,
    ...curated.opportunities,
  ];

  for (const s of sources) {
    logger.info(
      { count: s.count, status: s.status },
      `[${s.source}] ${s.status === "success" ? `${s.count} internships found` : `FAILED: ${s.error}`}`,
    );
  }
  logger.info({ total: opportunities.length }, "[Sources] Total discovered");

  return { sources, opportunities };
}
