import cron from "node-cron";
import { db, opportunitiesTable } from "@workspace/db";
import { and, eq, lt, or, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { logger } from "./logger";
import { collectAllSources } from "./sources";
import { getCompanyTier, computeRankScore } from "./company-tiers";

let isRunning = false;
export let lastRun: Date | null = null;
export let lastRunStatus: "success" | "failed" | "never" = "never";

function deduplicateOpportunities(
  incoming: ReturnType<typeof collectAllSources> extends Promise<infer T> ? T["opportunities"] : never,
) {
  const seen = new Map<string, (typeof incoming)[0]>();
  for (const opp of incoming) {
    // Dedup key: prefer sourceJobId+externalSource, fallback to applyUrl
    const key = opp.sourceJobId && opp.externalSource
      ? `${opp.externalSource}::${opp.sourceJobId}`
      : opp.applyUrl;
    if (!seen.has(key)) {
      seen.set(key, opp);
    }
  }
  return Array.from(seen.values());
}

export async function runCollection(): Promise<void> {
  if (isRunning) {
    logger.warn("[Scheduler] Collection already running, skipping");
    return;
  }
  isRunning = true;
  const startTime = Date.now();

  try {
    const { sources, opportunities } = await collectAllSources();
    const deduplicated = deduplicateOpportunities(opportunities);

    logger.info(
      { discovered: opportunities.length, afterDedup: deduplicated.length },
      "[Scheduler] Deduplication complete",
    );

    const today = new Date().toISOString().slice(0, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    // Archive opportunities older than 30 days
    const archiveResult = await db
      .update(opportunitiesTable)
      .set({ isActive: false, lastSeenAt: today })
      .where(
        and(
          eq(opportunitiesTable.isActive, true),
          lt(opportunitiesTable.publishedAt, cutoffStr),
        ),
      );

    logger.info("[Scheduler] Expired internships archived");

    // Upsert new/updated opportunities (only within 30-day window)
    const fresh = deduplicated.filter((opp) => {
      if (!opp.publishedAt) return true; // include if no date (curated)
      return opp.publishedAt >= cutoffStr;
    });

    let inserted = 0;
    let updated = 0;

    for (const opp of fresh) {
      try {
        const tier = getCompanyTier(opp.company);
        const rankScore = computeRankScore({
          companyTier: tier,
          fitScore: opp.fitScore,
          publishedAt: opp.publishedAt ?? null,
        });

        // Try to find existing by applyUrl or sourceJobId
        const existing = await db
          .select({ id: opportunitiesTable.id })
          .from(opportunitiesTable)
          .where(
            opp.sourceJobId && opp.externalSource
              ? and(
                  eq(opportunitiesTable.externalSource, opp.externalSource),
                  eq(opportunitiesTable.sourceJobId, opp.sourceJobId),
                )
              : eq(opportunitiesTable.applyUrl, opp.applyUrl),
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(opportunitiesTable)
            .set({
              lastSeenAt: today,
              lastChecked: today,
              isActive: true,
              companyTier: tier,
              rankScore,
            })
            .where(eq(opportunitiesTable.id, existing[0].id));
          updated++;
        } else {
          await db.insert(opportunitiesTable).values({
            ...opp,
            companyTier: tier,
            rankScore,
            firstSeenAt: opp.firstSeenAt ?? today,
          });
          inserted++;
        }
      } catch (err) {
        logger.warn({ err, company: opp.company, role: opp.role }, "[Scheduler] Upsert failed for opportunity");
      }
    }

    const elapsed = Date.now() - startTime;
    lastRun = new Date();
    lastRunStatus = "success";

    logger.info(
      { inserted, updated, elapsed },
      "[Scheduler] Collection completed successfully",
    );
  } catch (err) {
    lastRun = new Date();
    lastRunStatus = "failed";
    logger.error({ err }, "[Scheduler] Collection failed");
  } finally {
    isRunning = false;
  }
}

export function startScheduler(): void {
  if (process.env.CRON_ENABLED === "false") {
    logger.info("[Scheduler] CRON_ENABLED=false, scheduler not started");
    return;
  }

  logger.info("[Scheduler] Starting hourly collection schedule");

  // Run immediately on startup
  runCollection().catch((err) => logger.error({ err }, "[Scheduler] Initial run failed"));

  // Then every hour
  cron.schedule("0 * * * *", () => {
    runCollection().catch((err) => logger.error({ err }, "[Scheduler] Scheduled run failed"));
  });
}
