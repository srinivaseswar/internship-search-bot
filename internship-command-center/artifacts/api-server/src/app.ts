import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { starterOpportunities } from "./lib/career-data";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.DEMO_MODE === "true") {
  const opportunities = starterOpportunities.map((opportunity, index) => ({
    ...opportunity,
    id: index + 1,
  }));
  const profile = {
    id: 1,
    name: "Internship Seeker",
    degree: "B.Tech Information Technology",
    year: "3rd Year",
    country: "India",
    locations: ["Chennai", "Bangalore", "Hyderabad", "Pune", "Coimbatore", "Remote"],
    skills: ["Java", "Python", "C", "HTML", "CSS", "JavaScript", "React", "Node.js", "Express.js", "MongoDB", "Git & GitHub", "SQL", "REST APIs"],
    interests: ["Full Stack Development", "AI", "Web Development", "Software Engineering", "Backend Development", "Cloud", "Cybersecurity"],
    target: "Paid Software / IT Internship within 30 days",
  };

  app.get("/api/dashboard/summary", (_req, res) => {
    res.json({
      totalOpportunities: opportunities.length,
      verifiedCount: opportunities.filter((opportunity) => opportunity.verified).length,
      topMatch: opportunities[0]?.fitScore ?? 0,
      applications: 0,
      responseRate: 0,
      daysLeft: 30,
      recommendedToday: opportunities.slice(0, 3),
    });
  });
  app.get("/api/opportunities", (_req, res) => {
    const lastChecked = new Date().toISOString().slice(0, 10);
    res.json(opportunities.map((opportunity) => ({ ...opportunity, lastChecked })));
  });
  app.get("/api/applications", (_req, res) => res.json([]));
  app.get("/api/profile", (_req, res) => res.json(profile));
}

app.use("/api", router);

export default app;
