import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const opportunitiesTable = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
  mode: text("mode").notNull(),
  stipend: text("stipend").notNull(),
  stipendMin: integer("stipend_min"),
  eligibility: text("eligibility").notNull(),
  skills: text("skills").array().notNull(),
  deadline: text("deadline").notNull(),
  applyUrl: text("apply_url").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  hrEmail: text("hr_email"),
  recruiterLinkedin: text("recruiter_linkedin"),
  fitScore: integer("fit_score").notNull(),
  salaryScore: integer("salary_score").notNull(),
  growthScore: integer("growth_score").notNull(),
  brandScore: integer("brand_score").notNull(),
  learningScore: integer("learning_score").notNull(),
  verified: boolean("verified").notNull().default(false),
  saved: boolean("saved").notNull().default(false),
  lastChecked: date("last_checked", { mode: "string" }).notNull(),
  note: text("note"),
});

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  stage: text("stage").notNull(),
  appliedOn: date("applied_on", { mode: "string" }).notNull(),
  nextAction: text("next_action").notNull(),
  notes: text("notes"),
});

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  degree: text("degree").notNull(),
  year: text("year").notNull(),
  country: text("country").notNull(),
  locations: text("locations").array().notNull(),
  skills: text("skills").array().notNull(),
  interests: text("interests").array().notNull(),
  target: text("target").notNull(),
});

export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({ id: true });
export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true });
export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true });

export type Opportunity = typeof opportunitiesTable.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Profile = typeof profilesTable.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;