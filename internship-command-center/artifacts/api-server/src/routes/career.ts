import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, or } from "drizzle-orm";
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
import { starterOpportunities } from "../lib/career-data";

const router: IRouter = Router();
let seeded = false;

const starterProfile = {
  name: "Internship Seeker",
  degree: "B.Tech Information Technology",
  year: "3rd Year",
  country: "India",
  locations: ["Chennai", "Bangalore", "Hyderabad", "Pune", "Coimbatore", "Remote"],
  skills: ["Java", "Python", "C", "HTML", "CSS", "JavaScript", "React", "Node.js", "Express.js", "MongoDB", "Git & GitHub", "SQL", "REST APIs"],
  interests: ["Full Stack Development", "AI", "Web Development", "Software Engineering", "Backend Development", "Cloud", "Cybersecurity"],
  target: "Paid Software / IT Internship within 30 days",
};

async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  const existing = await db.select({ id: opportunitiesTable.id }).from(opportunitiesTable).limit(1);
  if (existing.length === 0) {
    await db.insert(opportunitiesTable).values(starterOpportunities);
  }
  const profile = await db.select({ id: profilesTable.id }).from(profilesTable).limit(1);
  if (profile.length === 0) {
    await db.insert(profilesTable).values(starterProfile);
  }
  seeded = true;
}

router.get("/opportunities", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListOpportunitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, location, mode, focus, minStipend, sort } = parsed.data;
  const filters = [];
  if (search) {
    filters.push(or(ilike(opportunitiesTable.role, `%${search}%`), ilike(opportunitiesTable.company, `%${search}%`)));
  }
  if (location) filters.push(ilike(opportunitiesTable.location, `%${location}%`));
  if (mode) filters.push(eq(opportunitiesTable.mode, mode));
  if (focus) filters.push(or(ilike(opportunitiesTable.role, `%${focus}%`), ilike(opportunitiesTable.note, `%${focus}%`)));
  if (minStipend !== undefined) filters.push(gte(opportunitiesTable.stipendMin, minStipend));
  const order = sort === "salary" ? desc(opportunitiesTable.salaryScore) : sort === "brand" ? desc(opportunitiesTable.brandScore) : sort === "learning" ? desc(opportunitiesTable.learningScore) : desc(opportunitiesTable.fitScore);
  const rows = await db.select().from(opportunitiesTable).where(filters.length ? and(...filters) : undefined).orderBy(order);
  res.json(ListOpportunitiesResponse.parse(rows));
});

router.get("/opportunities/:id", async (req, res): Promise<void> => {
  await ensureSeeded();
  const params = GetOpportunityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(opportunitiesTable).where(eq(opportunitiesTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  res.json(GetOpportunityResponse.parse(row));
});

router.patch("/opportunities/:id", async (req, res): Promise<void> => {
  await ensureSeeded();
  const params = UpdateOpportunityParams.safeParse(req.params);
  const body = UpdateOpportunityBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : "Invalid request body" });
    return;
  }
  const [row] = await db.update(opportunitiesTable).set(body.data).where(eq(opportunitiesTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }
  res.json(UpdateOpportunityResponse.parse(row));
});

router.get("/applications", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db.select().from(applicationsTable).orderBy(desc(applicationsTable.id));
  res.json(ListApplicationsResponse.parse(rows));
});

router.post("/applications", async (req, res): Promise<void> => {
  await ensureSeeded();
  const body = CreateApplicationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [row] = await db.insert(applicationsTable).values({ ...body.data, appliedOn: new Date().toISOString().slice(0, 10) }).returning();
  res.status(201).json(CreateApplicationResponse.parse(row));
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  await ensureSeeded();
  const params = UpdateApplicationParams.safeParse(req.params);
  const body = UpdateApplicationBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : "Invalid request body" });
    return;
  }
  const [row] = await db.update(applicationsTable).set(body.data).where(eq(applicationsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(UpdateApplicationResponse.parse(row));
});

router.get("/profile", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const [profile] = await db.select().from(profilesTable).limit(1);
  res.json(GetProfileResponse.parse(profile));
});

router.patch("/profile", async (req, res): Promise<void> => {
  await ensureSeeded();
  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [profile] = await db.select().from(profilesTable).limit(1);
  const [row] = await db.update(profilesTable).set(body.data).where(eq(profilesTable.id, profile.id)).returning();
  res.json(UpdateProfileResponse.parse(row));
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const opportunities = await db.select().from(opportunitiesTable).orderBy(desc(opportunitiesTable.fitScore));
  const applications = await db.select().from(applicationsTable);
  const top = opportunities.slice(0, 3);
  const summary = {
    totalOpportunities: opportunities.length,
    verifiedCount: opportunities.filter((item) => item.verified).length,
    topMatch: opportunities[0]?.fitScore ?? 0,
    applications: applications.length,
    responseRate: applications.length ? Math.round((applications.filter((item) => item.stage !== "Applied").length / applications.length) * 100) : 0,
    daysLeft: 30,
    recommendedToday: top,
  };
  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;