import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db, applicationsTable, opportunitiesTable, profilesTable } from "@workspace/db";
import {
  CreateApplicationBody,
  CreateApplicationResponse,
  GetDashboardSummaryResponse,
  GetOpportunityParams,
  GetOpportunityResponse,
  GetProfileResponse,
  ListApplicationsResponse,
  ListOpportunitiesQueryParams,
  ListOpportunitiesResponse,
  UpdateApplicationBody,
  UpdateApplicationParams,
  UpdateApplicationResponse,
  UpdateOpportunityBody,
  UpdateOpportunityParams,
  UpdateOpportunityResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Apply auth to all career routes
router.use(requireAuth);

// ── Opportunities ────────────────────────────────────────────────────────────

router.get("/opportunities", async (req, res): Promise<void> => {
  const parsed = ListOpportunitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, location, mode, focus, minStipend, sort } = parsed.data;

  // Extra params not in generated schema
  const days = Number(req.query["days"]) || 30;
  const reputed = req.query["reputed"] === "true";
  const remote = req.query["remote"] === "true";

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const filters = [
    // Only active internships
    eq(opportunitiesTable.isActive, true),
    // 30-day rolling window (server-enforced)
    or(
      gte(opportunitiesTable.publishedAt, cutoffStr),
      // fallback: include records without publishedAt (curated/legacy)
      sql`${opportunitiesTable.publishedAt} IS NULL`,
    ),
  ];

  if (search) {
    filters.push(or(ilike(opportunitiesTable.role, `%${search}%`), ilike(opportunitiesTable.company, `%${search}%`))!);
  }
  if (location) filters.push(ilike(opportunitiesTable.location, `%${location}%`));
  if (mode) filters.push(eq(opportunitiesTable.mode, mode));
  if (remote) filters.push(eq(opportunitiesTable.mode, "Remote"));
  if (focus) filters.push(or(ilike(opportunitiesTable.role, `%${focus}%`), ilike(opportunitiesTable.note, `%${focus}%`))!);
  if (minStipend !== undefined) filters.push(gte(opportunitiesTable.stipendMin, minStipend));
  if (reputed) filters.push(lte(opportunitiesTable.companyTier, 2));

  const order =
    sort === "salary" ? desc(opportunitiesTable.salaryScore)
    : sort === "brand" ? desc(opportunitiesTable.brandScore)
    : sort === "learning" ? desc(opportunitiesTable.learningScore)
    : sort === "newest" ? desc(opportunitiesTable.publishedAt)
    : sort === "rank" ? desc(opportunitiesTable.rankScore)
    : desc(opportunitiesTable.fitScore);

  const rows = await db
    .select()
    .from(opportunitiesTable)
    .where(and(...filters))
    .orderBy(order);

  res.json(ListOpportunitiesResponse.parse(rows));
});

router.get("/opportunities/:id", async (req, res): Promise<void> => {
  const params = GetOpportunityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  res.json(GetOpportunityResponse.parse(row));
});

router.patch("/opportunities/:id", async (req, res): Promise<void> => {
  const params = UpdateOpportunityParams.safeParse(req.params);
  const body = UpdateOpportunityBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : "Invalid request body" });
    return;
  }
  const [row] = await db
    .update(opportunitiesTable)
    .set(body.data)
    .where(eq(opportunitiesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  res.json(UpdateOpportunityResponse.parse(row));
});

// ── Applications ─────────────────────────────────────────────────────────────

router.get("/applications", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.id));
  res.json(ListApplicationsResponse.parse(rows));
});

router.post("/applications", async (req, res): Promise<void> => {
  const body = CreateApplicationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [row] = await db
    .insert(applicationsTable)
    .values({ ...body.data, appliedOn: new Date().toISOString().slice(0, 10) })
    .returning();
  res.status(201).json(CreateApplicationResponse.parse(row));
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  const params = UpdateApplicationParams.safeParse(req.params);
  const body = UpdateApplicationBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : "Invalid request body" });
    return;
  }
  const [row] = await db
    .update(applicationsTable)
    .set(body.data)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(UpdateApplicationResponse.parse(row));
});

// ── Profile ───────────────────────────────────────────────────────────────────

router.get("/profile", async (_req, res): Promise<void> => {
  const [profile] = await db.select().from(profilesTable).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(GetProfileResponse.parse(profile));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [profile] = await db.select().from(profilesTable).limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  const [row] = await db
    .update(profilesTable)
    .set(body.data)
    .where(eq(profilesTable.id, profile.id))
    .returning();
  res.json(UpdateProfileResponse.parse(row));
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const opportunities = await db
    .select()
    .from(opportunitiesTable)
    .where(
      and(
        eq(opportunitiesTable.isActive, true),
        or(
          gte(opportunitiesTable.publishedAt, cutoffStr),
          sql`${opportunitiesTable.publishedAt} IS NULL`,
        ),
      ),
    )
    .orderBy(desc(opportunitiesTable.rankScore));

  const applications = await db.select().from(applicationsTable);
  const top = opportunities.slice(0, 3);
  const summary = {
    totalOpportunities: opportunities.length,
    verifiedCount: opportunities.filter((item) => item.verified).length,
    topMatch: opportunities[0]?.fitScore ?? 0,
    applications: applications.length,
    responseRate: applications.length
      ? Math.round(
          (applications.filter((item) => item.stage !== "Applied").length /
            applications.length) *
            100,
        )
      : 0,
    daysLeft: 30,
    recommendedToday: top,
  };
  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
