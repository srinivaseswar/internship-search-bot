import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../middlewares/auth";
import { z } from "zod/v4";

const router: IRouter = Router();

const RegisterBody = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const body = RegisterBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid input", details: body.error.issues });
    return;
  }

  const { email, password, name } = body.data;

  // Check if email already exists
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ email: email.toLowerCase(), passwordHash, name })
    .returning();

  const token = signToken({ userId: user.id, email: user.email, name: user.name });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// POST /api/auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const body = LoginBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = body.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, name: user.name });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, (req, res): void => {
  res.json({ user: req.user });
});

export default router;
